"use client";

import Link from "next/link";
import ErrorNote from "@/components/ErrorNote";
import { useEffect, useRef, useState } from "react";
import { presenceReport, type CheckState } from "@/lib/report";
import { whatsappNumber } from "@/lib/score";
import { authFetch, updateLead, useLeads, useLeadsLoaded, useProfile } from "@/lib/storage";
import type { Lead, SiteCheck } from "@/lib/types";

const ICON: Record<CheckState, { sym: string; cls: string }> = {
  pass: { sym: "✓", cls: "bg-emerald-100 text-emerald-700" },
  warn: { sym: "!", cls: "bg-amber-100 text-amber-700" },
  fail: { sym: "✕", cls: "bg-rose-100 text-rose-700" },
  unknown: { sym: "?", cls: "bg-slate-100 text-slate-500" },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : "#e11d48";
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          transform="rotate(-90 66 66)"
        />
        <text x="66" y="70" textAnchor="middle" fontSize="34" fontWeight="700" fill="#0f172a">{score}</text>
        <text x="66" y="92" textAnchor="middle" fontSize="12" fill="#64748b">out of 100</text>
      </svg>
      <span className="mt-1 rounded-full px-3 py-0.5 text-sm font-semibold" style={{ background: color + "1a", color }}>{grade}</span>
    </div>
  );
}

function reportPitch(lead: Lead, name: string, score: number) {
  return `Hi ${lead.name} team 👋\n\nI'm ${name || "[Your Name]"}, a website developer. I prepared a free online presence report for your business. Your score is ${score}/100, and I've listed a few simple fixes that can bring you more customers from Google.\n\nShall I send you the PDF? 😊`;
}

export default function ReportView({ id }: { id: string }) {
  const leads = useLeads();
  const profile = useProfile();
  const loaded = useLeadsLoaded();
  const lead = leads.find((l) => l.id === id);
  const checking = useRef(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const needsCheck = !!lead && lead.websiteStatus === "website" && !!lead.website && !lead.siteCheck;

  // Run the website check automatically if it hasn't been done yet
  useEffect(() => {
    if (!needsCheck || checking.current || !lead?.website) return;
    checking.current = true;
    authFetch("/api/check-site", { url: lead.website })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Website check failed");
        updateLead(lead.id, { siteCheck: json as SiteCheck });
      })
      .catch((e) => setCheckError((e as Error).message));
  }, [needsCheck, lead]);

  // PDF file name = page title
  useEffect(() => {
    if (lead) document.title = `${lead.name} – Online Presence Report`;
  }, [lead]);

  if (!lead && !loaded) return <p className="py-20 text-center text-slate-400">Loading report…</p>;

  if (!lead) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold">Report not found</h1>
        <p className="mt-2 text-slate-500">Save the lead first, then open its report.</p>
        <Link href="/leads" className="mt-4 inline-block text-indigo-600 hover:underline">Go to My leads</Link>
      </div>
    );
  }

  const report = presenceReport(lead);
  const wa = whatsappNumber(lead);
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const profileIncomplete = !profile.name || !profile.phone;

  return (
    <div className="space-y-4">
      {/* Toolbar (not printed) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/leads" className="text-sm text-slate-500 hover:text-slate-800">← My leads</Link>
        <div className="flex flex-wrap gap-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(reportPitch(lead, profile.name, report.score))}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              WhatsApp: offer the report
            </a>
          )}
          <button
            onClick={() => window.print()}
            disabled={needsCheck && !checkError}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {needsCheck && !checkError ? "Checking website…" : "Download PDF"}
          </button>
        </div>
      </div>
      {profileIncomplete && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200 print:hidden">
          Add your name, WhatsApp number and logo in <Link href="/settings" className="font-semibold underline">My branding</Link> so they appear on the report.
        </p>
      )}
      <p className="text-xs text-slate-400 print:hidden">Tip: in the print window choose <b>“Save as PDF”</b> as the destination.</p>
      {checkError && <ErrorNote message={checkError} className="print:hidden" />}

      {/* The report (A4) */}
      <article className="report mx-auto max-w-[800px] bg-white p-10 shadow-sm ring-1 ring-slate-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            {profile.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logo} alt="" className="h-14 w-14 object-contain" />
            ) : null}
            <div>
              <p className="text-lg font-bold text-slate-900">{profile.brand || profile.name || "Your Brand"}</p>
              <p className="text-xs text-slate-500">{[profile.phone, profile.email].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Free Online Presence Report</p>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
        </header>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-slate-400">Prepared for</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{lead.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{lead.address}</p>
            <p className="mt-2 text-sm text-slate-700">
              {lead.rating !== null ? `⭐ ${lead.rating} on Google (${lead.reviews.toLocaleString("en-IN")} reviews)` : "No Google rating yet"}
              {lead.website ? ` · ${lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "")}` : " · No website"}
            </p>
          </div>
          <ScoreRing score={report.score} grade={report.grade} />
        </section>

        <section className="mt-8">
          <h2 className="text-base font-bold text-slate-900">What we checked</h2>
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {report.items.map((i) => (
              <li key={i.label} className="flex items-start gap-3 px-4 py-3 break-inside-avoid">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold ${ICON[i.state].cls}`}>{ICON[i.state].sym}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{i.label}</p>
                  <p className="text-sm text-slate-500">{i.detail}</p>
                </div>
                <span className="text-xs text-slate-400">{i.points}/{i.max}</span>
              </li>
            ))}
          </ul>
        </section>

        {lead.websiteStatus !== "website" && (
          <section className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-950 break-inside-avoid">
            <p className="font-semibold">Why this matters</p>
            <p className="mt-1">
              When people search for a business like yours on Google, they compare options in seconds. Businesses with a proper website look more
              trustworthy, show up in more searches, and make it easy to call, book or order on WhatsApp right away.
            </p>
          </section>
        )}

        <section className="mt-6 break-inside-avoid">
          <h2 className="text-base font-bold text-slate-900">Recommended next steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {needsCheck && !checkError ? (
              <li className="list-none text-slate-400">Checking the website… results appear in about 30 seconds.</li>
            ) : (
              report.recommendations.map((r) => <li key={r}>{r}</li>)
            )}
          </ol>
        </section>

        <section className="mt-8 rounded-xl bg-slate-900 p-5 text-white break-inside-avoid">
          <p className="text-lg font-bold">Want help fixing this?</p>
          <p className="mt-1 text-sm text-slate-300">I can take care of all of the above for you. Let&apos;s have a free, no-obligation chat.</p>
          <p className="mt-3 text-sm font-semibold">
            {profile.name || "Your Name"}
            {profile.brand ? ` · ${profile.brand}` : ""}
          </p>
          <p className="text-sm text-slate-300">{[profile.phone && `WhatsApp: ${profile.phone}`, profile.email].filter(Boolean).join(" · ") || "Add your contact details in My branding"}</p>
        </section>

        <footer className="mt-6 text-[11px] leading-relaxed text-slate-400">
          Data from Google Maps and Google PageSpeed Insights (mobile test){lead.siteCheck ? `, checked on ${new Date(lead.siteCheck.checkedAt).toLocaleDateString("en-IN")}` : ""}. Scores
          can vary slightly between tests.
        </footer>
      </article>
    </div>
  );
}
