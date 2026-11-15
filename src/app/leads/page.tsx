"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { HeatBadge, WebsiteBadge } from "@/components/Badges";
import FollowUpModal from "@/components/FollowUpModal";
import Icon, { type IconName } from "@/components/Icon";
import PitchModal from "@/components/PitchModal";
import { scoreLead, whatsappNumber } from "@/lib/score";
import { removeLead, updateLead, useLeads, useLeadsLoaded } from "@/lib/storage";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Replied", "Won", "Lost"];

const STATUS_STYLE: Record<LeadStatus, string> = {
  New: "bg-slate-100 text-slate-700 ring-slate-200",
  Contacted: "bg-violet-100 text-violet-800 ring-violet-200",
  Replied: "bg-amber-100 text-amber-900 ring-amber-200",
  Won: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Lost: "bg-rose-100 text-rose-700 ring-rose-200",
};

type LeadFilter = LeadStatus | "All" | "Due";

function subscribeToDate(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
  };
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysOld(iso: string | undefined) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.max(0, Math.round((Date.now() - t) / 86400_000));
}

function exportCsv(leads: Lead[]) {
  const cols = ["name", "phone", "website", "websiteStatus", "rating", "reviews", "status", "followUp", "notes", "address", "searchQuery"] as const;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...leads.map((l) => cols.map((c) => esc(l[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `client-finder-leads-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ icon, value, label, tone = "slate" }: { icon: IconName; value: string; label: string; tone?: "slate" | "amber" | "emerald" }) {
  const ring = tone === "amber" ? "ring-amber-200 bg-amber-50" : tone === "emerald" ? "ring-emerald-200 bg-emerald-50" : "ring-slate-200 bg-white";
  const mark = tone === "amber" ? "bg-amber-100 text-amber-800" : tone === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700";
  return (
    <div className={`rounded-2xl p-3 ring-1 sm:p-4 ${ring}`}>
      <span className={`grid size-9 place-items-center rounded-xl ${mark}`}>
        <Icon name={icon} className="size-4" />
      </span>
      <span className="mt-3 block text-2xl font-bold tabular-nums text-slate-900">{value}</span>
      <span className="mt-0.5 block text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

export default function LeadsPage() {
  const leads = useLeads();
  const loaded = useLeadsLoaded();
  const date = useSyncExternalStore(subscribeToDate, today, () => "");
  const [pitching, setPitching] = useState<Lead | null>(null);
  const [following, setFollowing] = useState<Lead | null>(null);
  const [tab, setTab] = useState<LeadFilter>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "follow-up" | "score">("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts: Record<LeadFilter, number> = { All: leads.length, Due: 0, New: 0, Contacted: 0, Replied: 0, Won: 0, Lost: 0 };
  const search = query.trim().toLowerCase();

  const rows = leads.map((lead) => {
    const active = lead.status !== "Won" && lead.status !== "Lost";
    const followUp = active ? lead.followUp : null;
    const isDue = Boolean(date && followUp && followUp <= date);
    counts[lead.status]++;
    if (isDue) counts.Due++;
    return { lead, followUp, isDue, score: scoreLead(lead, lead.siteCheck) };
  });

  const shown = rows.filter(({ lead, isDue }) => {
    const matches = tab === "All" || tab === lead.status || (tab === "Due" && isDue);
    return (
      matches &&
      (!search || [lead.name, lead.address, lead.phone, lead.notes, lead.searchQuery].some((v) => v?.toLowerCase().includes(search)))
    );
  });

  if (sort === "follow-up") shown.sort((a, b) => (a.followUp ?? "9999").localeCompare(b.followUp ?? "9999"));
  else if (sort === "score") shown.sort((a, b) => b.score.score - a.score.score);
  else shown.sort((a, b) => (b.lead.savedAt ?? "").localeCompare(a.lead.savedAt ?? ""));

  const dueList = rows.filter((r) => r.isDue).sort((a, b) => (a.followUp ?? "").localeCompare(b.followUp ?? ""));
  const inPlay = counts.New + counts.Contacted + counts.Replied;
  const decided = counts.Won + counts.Lost;
  const winRate = decided ? Math.round((counts.Won / decided) * 100) : null;

  function setStatus(l: Lead, status: LeadStatus) {
    const patch: Partial<Lead> = { status };
    if (status === "Contacted" && !l.followUp) patch.followUp = inDays(3);
    if (status === "Replied" && !l.followUp) patch.followUp = inDays(2);
    if (status === "Won" || status === "Lost") patch.followUp = null;
    updateLead(l.id, patch);
  }

  /** After a follow-up is sent: keep it moving and schedule the next touch. */
  function afterFollowUp(l: Lead, nextInDays: number) {
    const patch: Partial<Lead> = { followUp: nextInDays > 0 ? inDays(nextInDays) : null };
    if (l.status === "New") patch.status = "Contacted";
    updateLead(l.id, patch);
  }

  if (!loaded) return <p className="py-20 text-center text-slate-400">Loading your leads…</p>;

  if (leads.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
          <Icon name="users" className="size-5" />
        </span>
        <h1 className="mt-4 text-xl font-bold">No saved leads yet</h1>
        <p className="mt-2 text-slate-500">Search on the Find leads page, then press Save lead on the ones worth chasing.</p>
        <Link href="/" className="btn-shine mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700">
          <Icon name="search" className="size-4" />
          Find leads
        </Link>
      </div>
    );
  }

  const stageButton = (l: Lead, s: LeadStatus) => (
    <button
      key={s}
      type="button"
      onClick={() => setStatus(l, s)}
      aria-pressed={l.status === s}
      className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-medium transition-colors ${
        l.status === s ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-white"
      }`}
    >
      {s}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My leads</h1>
          <p className="mt-1 text-sm text-slate-600">Your pipeline, from saved to signed.</p>
        </div>
        <button
          onClick={() => exportCsv(leads)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          <Icon name="download" className="size-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="users" value={String(inPlay)} label="Leads in play" />
        <Stat icon="clock" value={String(counts.Due)} label="Need a follow-up" tone={counts.Due ? "amber" : "slate"} />
        <Stat icon="chat" value={String(counts.Replied)} label="Replied to you" />
        <Stat icon="star" value={winRate === null ? "—" : `${winRate}%`} label={`Won ${counts.Won} of ${decided || 0}`} tone={counts.Won ? "emerald" : "slate"} />
      </div>

      {dueList.length > 0 && (
        <section className="animate-fade-up rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Icon name="clock" className="size-4" />
            Chase these today ({dueList.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {dueList.slice(0, 5).map(({ lead: l, followUp }) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 ring-1 ring-amber-100">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{l.name}</p>
                  <p className="text-xs text-slate-500">
                    {followUp === date ? "Due today" : "Overdue"} · {l.status}
                    {daysOld(l.savedAt) !== null && ` · saved ${daysOld(l.savedAt)}d ago`}
                  </p>
                </div>
                <button
                  onClick={() => setFollowing(l)}
                  className="btn-shine inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <Icon name="chat" className="size-4" />
                  Follow up
                </button>
              </li>
            ))}
          </ul>
          {dueList.length > 5 && (
            <button onClick={() => setTab("Due")} className="mt-2 min-h-10 text-sm font-medium text-amber-900 hover:underline">
              See all {dueList.length}
            </button>
          )}
        </section>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 focus-within:border-violet-500">
            <Icon name="search" className="size-4 shrink-0 text-violet-600" />
            <span className="sr-only">Search saved leads</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, address or notes"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Sort leads</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="recent">Recently saved</option>
              <option value="follow-up">Next follow-up</option>
              <option value="score">Highest lead score</option>
            </select>
          </label>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter leads">
          {(["All", "Due", ...STATUSES] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setTab(f);
                if (f === "Due") setSort("follow-up");
              }}
              aria-pressed={tab === f}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium sm:text-sm ${
                tab === f ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 text-slate-700 hover:bg-violet-50"
              }`}
            >
              {f}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === f ? "bg-white/20" : "bg-violet-50 text-violet-700"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-slate-600">
        Showing {shown.length} of {leads.length}
      </p>

      {shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="font-semibold text-slate-900">Nothing in this view</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTab("All");
            }}
            className="mt-2 min-h-11 text-sm font-medium text-violet-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {shown.map(({ lead: l, score: s, isDue, followUp }) => {
          const wa = whatsappNumber(l);
          const open = openId === l.id;
          return (
            <li key={l.id} className={`rounded-2xl bg-white p-4 ring-1 transition-shadow ${isDue ? "ring-amber-300" : "ring-slate-200"}`}>
              <div className="flex flex-wrap items-start gap-2">
                <HeatBadge heat={s.heat} score={s.score} />
                <h2 className="min-w-0 flex-1 break-words font-semibold text-slate-900">{l.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[l.status]}`}>{l.status}</span>
              </div>

              <p className="mt-1.5 break-words text-sm text-slate-600">
                {l.phone ? (
                  <>
                    <Icon name="phone" className="inline size-3.5 align-[-2px] text-violet-500" /> {l.phone}
                  </>
                ) : (
                  "No phone"
                )}{" "}
                · <Icon name="star" className="inline size-3.5 align-[-2px] text-amber-500" /> {l.rating ?? "–"} ({l.reviews.toLocaleString("en-IN")})
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <WebsiteBadge status={l.websiteStatus} />
                {isDue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                    <Icon name="clock" className="size-3" />
                    {followUp === date ? "Due today" : "Overdue"}
                  </span>
                )}
                {!isDue && followUp && <span className="text-slate-500">Next touch {followUp}</span>}
              </div>

              <div className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label={`Stage for ${l.name}`}>
                {STATUSES.map((st) => stageButton(l, st))}
              </div>

              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                <button
                  onClick={() => setFollowing(l)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <Icon name="chat" className="size-4" />
                  Follow-up
                </button>
                <button
                  onClick={() => setPitching(l)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-medium text-violet-700 hover:bg-violet-100"
                >
                  <Icon name="spark" className="size-4" />
                  First pitch
                </button>
                {wa && (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Icon name="chat" className="size-4" />
                    Chat
                  </a>
                )}
                {l.phone && (
                  <a
                    href={`tel:${l.intlPhone || l.phone}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="phone" className="size-4" />
                    Call
                  </a>
                )}
                <Link
                  href={`/report/${encodeURIComponent(l.id)}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Icon name="doc" className="size-4" />
                  Report
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setOpenId(open ? null : l.id)}
                aria-expanded={open}
                className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <Icon name="arrow" className={`size-3.5 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
                {open ? "Hide details" : "Notes, dates & more"}
              </button>

              {open && (
                <div className="animate-fade mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    {l.address} · from “{l.searchQuery}”
                    {daysOld(l.savedAt) !== null && ` · saved ${daysOld(l.savedAt)} days ago`}
                  </p>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Notes</span>
                    <textarea
                      aria-label={`Notes for ${l.name}`}
                      defaultValue={l.notes}
                      onBlur={(e) => updateLead(l.id, { notes: e.target.value })}
                      placeholder="What was said, what they asked for, price quoted…"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Next follow-up</span>
                    <input
                      type="date"
                      value={l.followUp ?? ""}
                      onChange={(e) => updateLead(l.id, { followUp: e.target.value || null })}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 sm:w-56"
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${l.name} from your leads?`)) removeLead(l.id);
                    }}
                    className="min-h-10 text-xs font-medium text-slate-500 hover:text-rose-600"
                  >
                    Remove this lead
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {pitching && (
        <PitchModal
          business={pitching}
          siteCheck={pitching.siteCheck}
          onClose={() => setPitching(null)}
          onSent={() => pitching.status === "New" && setStatus(pitching, "Contacted")}
        />
      )}
      {following && <FollowUpModal lead={following} onClose={() => setFollowing(null)} onSent={(days) => afterFollowUp(following, days)} />}
    </div>
  );
}
