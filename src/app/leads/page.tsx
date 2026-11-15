"use client";

import Icon, { type IconName } from "@/components/Icon";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { HeatBadge, WebsiteBadge } from "@/components/Badges";
import PitchModal from "@/components/PitchModal";
import { scoreLead } from "@/lib/score";
import { removeLead, updateLead, useLeads, useLeadsLoaded } from "@/lib/storage";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Replied", "Won", "Lost"];
const STATUS_STYLE: Record<LeadStatus, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-violet-100 text-violet-800",
  Replied: "bg-amber-100 text-amber-800",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

type LeadFilter = LeadStatus | "All" | "Due" | "Upcoming";

const SUMMARY: { filter: LeadFilter; label: string; icon: IconName }[] = [
  { filter: "All", label: "Saved leads", icon: "users" },
  { filter: "Due", label: "Follow-ups due", icon: "clock" },
  { filter: "Upcoming", label: "Upcoming follow-ups", icon: "check" },
  { filter: "Won", label: "Won leads", icon: "star" },
];

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

function exportCsv(leads: Lead[]) {
  const cols = ["name", "phone", "website", "websiteStatus", "rating", "reviews", "status", "followUp", "notes", "address", "searchQuery"] as const;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...leads.map((l) => cols.map((c) => esc(l[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `client-finder-leads-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsPage() {
  const leads = useLeads();
  const [pitching, setPitching] = useState<Lead | null>(null);
  const [tab, setTab] = useState<LeadFilter>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "follow-up" | "score">("recent");
  const loaded = useLeadsLoaded();
  const date = useSyncExternalStore(subscribeToDate, today, () => "");

  const counts: Record<LeadFilter, number> = {
    All: leads.length, Due: 0, Upcoming: 0, New: 0, Contacted: 0, Replied: 0, Won: 0, Lost: 0,
  };
  const search = query.trim().toLowerCase();
  const shown = leads.map((lead) => {
    const active = lead.status !== "Won" && lead.status !== "Lost";
    const followUp = active ? lead.followUp : null;
    const isDue = Boolean(date && followUp && followUp <= date);
    const upcoming = Boolean(date && followUp && followUp > date);
    counts[lead.status]++;
    if (isDue) counts.Due++;
    if (upcoming) counts.Upcoming++;
    return { lead, followUp, isDue, upcoming, score: scoreLead(lead, lead.siteCheck) };
  }).filter(({ lead, isDue, upcoming }) => {
    const matchesFilter = tab === "All" || tab === lead.status || (tab === "Due" && isDue) || (tab === "Upcoming" && upcoming);
    return matchesFilter && (!search || [lead.name, lead.address, lead.phone, lead.notes, lead.searchQuery]
      .some((value) => value?.toLowerCase().includes(search)));
  });

  if (sort === "follow-up") {
    shown.sort((a, b) => (a.followUp ?? "9999").localeCompare(b.followUp ?? "9999"));
  } else if (sort === "score") {
    shown.sort((a, b) => b.score.score - a.score.score);
  } else {
    shown.sort((a, b) => (b.lead.savedAt ?? "").localeCompare(a.lead.savedAt ?? ""));
  }

  function selectFilter(filter: LeadFilter) {
    setTab(filter);
    if (filter === "Due" || filter === "Upcoming") setSort("follow-up");
  }

  function setStatus(l: Lead, status: LeadStatus) {
    // Auto follow-up: after contacting, remind in 3 days
    const patch: Partial<Lead> = { status };
    if (status === "Contacted" && !l.followUp) patch.followUp = inDays(3);
    if (status === "Won" || status === "Lost") patch.followUp = null;
    updateLead(l.id, patch);
  }

  if (!loaded) return <p className="py-20 text-center text-slate-400">Loading your leads…</p>;

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold">No saved leads yet</h1>
        <p className="mt-2 text-slate-500">Search for businesses on the “Find leads” page and click “Save lead”.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My leads</h1>
          <p className="mt-1 text-sm text-slate-600">Track conversations and see who needs a follow-up.</p>
        </div>
        <button onClick={() => exportCsv(leads)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-medium text-violet-700 hover:bg-violet-50">
          <Icon name="download" className="size-4" /> Download CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SUMMARY.map(({ filter, label, icon }) => (
          <button key={filter} type="button" onClick={() => selectFilter(filter)} aria-pressed={tab === filter}
            className={`rounded-2xl border p-3 text-left transition-colors sm:p-4 ${tab === filter ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"}`}>
            <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Icon name={icon} className="size-4" />
            </span>
            <span className="mt-3 block text-2xl font-bold tabular-nums text-slate-900">{counts[filter]}</span>
            <span className="mt-1 block text-xs font-medium text-slate-600 sm:text-sm">{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 focus-within:border-violet-500">
            <Icon name="search" className="size-4 shrink-0 text-violet-600" />
            <span className="sr-only">Search saved leads</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, address or notes"
              className="w-full min-w-0 bg-transparent text-sm outline-none" />
          </label>
          <label>
            <span className="sr-only">Sort leads</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
              <option value="recent">Recently saved</option>
              <option value="follow-up">Next follow-up</option>
              <option value="score">Highest lead score</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter by lead status" role="group">
          {(["All", "Due", "Upcoming", ...STATUSES] as const).map((filter) => (
            <button key={filter} type="button" onClick={() => selectFilter(filter)} aria-pressed={tab === filter}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium sm:text-sm ${tab === filter ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 text-slate-700 hover:bg-violet-50"}`}>
              {filter}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === filter ? "bg-white/20" : "bg-violet-50 text-violet-700"}`}>{counts[filter]}</span>
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-slate-600">Showing {shown.length} of {leads.length} leads</p>
      {shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="font-semibold text-slate-900">No leads match this view</p>
          <button type="button" onClick={() => { setQuery(""); setTab("All"); }} className="mt-2 min-h-11 text-sm font-medium text-violet-700 hover:underline">Clear filters</button>
        </div>
      )}
      <ul className="space-y-3">
        {shown.map(({ lead: l, score: s, isDue }) => {
          return (
            <li key={l.id} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${isDue ? "ring-amber-300" : "ring-slate-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HeatBadge heat={s.heat} score={s.score} />
                    <h2 className="break-words font-semibold">{l.name}</h2>
                    <WebsiteBadge status={l.websiteStatus} />
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>{l.status}</span>
                  </div>
                  {isDue && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                      <Icon name="clock" className="size-3.5" />
                      {l.followUp === date ? "Due today" : "Overdue"}
                    </p>
                  )}
                  <p className="mt-2 break-words text-sm text-slate-600">
                    {l.phone ? (
                      <>
                        <Icon name="phone" className="inline h-3.5 w-3.5 align-[-2px] text-violet-500" /> {l.phone}
                      </>
                    ) : (
                      "No phone"
                    )}{" "}
                    · <Icon name="star" className="inline h-3.5 w-3.5 align-[-2px] text-amber-500" /> {l.rating ?? "–"} ({l.reviews.toLocaleString("en-IN")}) · <span className="text-slate-400">from “{l.searchQuery}”</span>
                  </p>
                  <textarea
                    aria-label={"Notes for " + l.name}
                    defaultValue={l.notes}
                    onBlur={(e) => updateLead(l.id, { notes: e.target.value })}
                    placeholder="Notes (e.g. spoke to owner, wants quote by Friday)"
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-56">
                  <select aria-label={"Status for " + l.name} value={l.status} onChange={(e) => setStatus(l, e.target.value as LeadStatus)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">
                    {STATUSES.map((st) => <option key={st}>{st}</option>)}
                  </select>
                  <label className="text-xs text-slate-500">
                    Follow up on
                    <input
                      type="date"
                      value={l.followUp ?? ""}
                      onChange={(e) => updateLead(l.id, { followUp: e.target.value || null })}
                      className="mt-0.5 min-h-11 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-800"
                    />
                  </label>
                  <button
                    onClick={() => setPitching(l)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg min-h-11 bg-violet-600 px-3 py-1.5 text-center text-sm font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    <Icon name="spark" className="h-4 w-4" />
                    AI pitch
                  </button>
                  <Link
                    href={`/report/${encodeURIComponent(l.id)}`}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 text-center text-sm font-medium text-violet-700 hover:bg-violet-100"
                  >
                    <Icon name="doc" className="size-4" /> Audit report
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${l.name} from your leads?`)) removeLead(l.id);
                    }}
                    className="min-h-10 text-xs text-slate-500 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
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
    </div>
  );
}
