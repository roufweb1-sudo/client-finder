"use client";

import Icon from "@/components/Icon";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HeatBadge, WebsiteBadge } from "@/components/Badges";
import PitchModal from "@/components/PitchModal";
import { scoreLead } from "@/lib/score";
import { removeLead, updateLead, useLeads, useLeadsLoaded } from "@/lib/storage";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Replied", "Won", "Lost"];
const STATUS_STYLE: Record<LeadStatus, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-700",
  Replied: "bg-amber-100 text-amber-800",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

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
  const [tab, setTab] = useState<LeadStatus | "All" | "Due">("All");
  const loaded = useLeadsLoaded();

  const due = useMemo(() => leads.filter((l) => l.followUp && l.followUp <= today() && l.status !== "Won" && l.status !== "Lost"), [leads]);

  const shown = useMemo(() => {
    if (tab === "All") return leads;
    if (tab === "Due") return due;
    return leads.filter((l) => l.status === tab);
  }, [leads, tab, due]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: leads.length, Due: due.length };
    for (const s of STATUSES) c[s] = leads.filter((l) => l.status === s).length;
    return c;
  }, [leads, due]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My leads</h1>
        <button onClick={() => exportCsv(leads)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
          Download CSV
        </button>
      </div>

      {due.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          ⏰ <b>{due.length}</b> follow-up{due.length > 1 ? "s" : ""} due today.{" "}
          <button onClick={() => setTab("Due")} className="font-semibold underline">Show them</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["All", "Due", ...STATUSES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-sm ${tab === t ? "bg-violet-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t === "Due" ? "Follow-up due" : t} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {shown.map((l) => {
          const s = scoreLead(l, l.siteCheck);
          const isDue = l.followUp && l.followUp <= today() && l.status !== "Won" && l.status !== "Lost";
          return (
            <li key={l.id} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${isDue ? "ring-amber-300" : "ring-slate-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HeatBadge heat={s.heat} score={s.score} />
                    <h2 className="font-semibold">{l.name}</h2>
                    <WebsiteBadge status={l.websiteStatus} />
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>{l.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
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
                    defaultValue={l.notes}
                    onBlur={(e) => updateLead(l.id, { notes: e.target.value })}
                    placeholder="Notes (e.g. spoke to owner, wants quote by Friday)"
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-56">
                  <select value={l.status} onChange={(e) => setStatus(l, e.target.value as LeadStatus)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                    {STATUSES.map((st) => <option key={st}>{st}</option>)}
                  </select>
                  <label className="text-xs text-slate-500">
                    Follow up on
                    <input
                      type="date"
                      value={l.followUp ?? ""}
                      onChange={(e) => updateLead(l.id, { followUp: e.target.value || null })}
                      className="mt-0.5 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-800"
                    />
                  </label>
                  <button
                    onClick={() => setPitching(l)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Icon name="spark" className="h-4 w-4" />
                    AI pitch
                  </button>
                  <Link
                    href={`/report/${encodeURIComponent(l.id)}`}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-center text-sm font-medium text-violet-700 hover:bg-violet-100"
                  >
                    Audit report
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${l.name} from your leads?`)) removeLead(l.id);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600"
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
