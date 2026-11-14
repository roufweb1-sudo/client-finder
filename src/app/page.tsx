"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HeatBadge, WebsiteBadge } from "@/components/Badges";
import ErrorNote from "@/components/ErrorNote";
import PitchModal from "@/components/PitchModal";
import { refreshAccount } from "@/lib/account";
import { pitchMessage, scoreLead } from "@/lib/score";
import { addLead, authFetch, setMyName, useLeads, useMyName } from "@/lib/storage";
import type { Business, SiteCheck } from "@/lib/types";

const QUICK_TYPES = ["Bakeries", "Dental clinics", "Salons", "Restaurants", "Boutiques", "Gyms", "Tuition centres", "Interior designers"];
type Filter = "all" | "hot" | "nowebsite";

export default function FindLeadsPage() {
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, SiteCheck | "loading">>({});
  const [filter, setFilter] = useState<Filter>("all");
  const leads = useLeads();
  const saved = useMemo(() => new Set(leads.map((l) => l.id)), [leads]);
  const myName = useMyName();
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();
  const [pitching, setPitching] = useState<Business | null>(null);

  async function search(pageToken?: string) {
    const q = pageToken ? query : `${type.trim()} in ${city.trim()}`;
    if (!pageToken && (!type.trim() || !city.trim())) {
      setError("Enter a business type and a city.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/search", { query: q, pageToken });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setQuery(q);
      setResults((prev) => {
        const list: Business[] = pageToken ? [...prev, ...json.businesses] : json.businesses;
        return Array.from(new Map(list.map((b) => [b.id, b])).values());
      });
      setNextToken(json.nextPageToken);
      void refreshAccount();
      if (!pageToken) setChecks({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function checkSite(b: Business) {
    if (!b.website || b.websiteStatus !== "website") return;
    setChecks((c) => ({ ...c, [b.id]: "loading" }));
    try {
      const res = await authFetch("/api/check-site", { url: b.website });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setChecks((c) => ({ ...c, [b.id]: json as SiteCheck }));
      void refreshAccount();
    } catch (e) {
      setError((e as Error).message);
      setChecks((c) => {
        const next = { ...c };
        delete next[b.id];
        return next;
      });
    }
  }

  async function checkAll() {
    const todo = results.filter((b) => b.websiteStatus === "website" && !checks[b.id]);
    const queue = [...todo];
    const worker = async () => {
      while (queue.length) {
        const b = queue.shift();
        if (b) await checkSite(b);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  function save(b: Business) {
    const c = checks[b.id];
    addLead(b, query, c && c !== "loading" ? c : null);
  }

  function pitchFor(b: Business) {
    const c = checks[b.id];
    return pitchMessage(b, c && c !== "loading" ? c : null, myName || "[Your Name]");
  }

  const scored = useMemo(() => {
    return results
      .map((b) => {
        const c = checks[b.id];
        return { b, s: scoreLead(b, c && c !== "loading" ? c : null) };
      })
      .filter(({ b, s }) => (filter === "hot" ? s.heat === "hot" : filter === "nowebsite" ? b.websiteStatus !== "website" : true))
      .sort((x, y) => y.s.score - x.s.score);
  }, [results, checks, filter]);

  const stats = useMemo(() => {
    const none = results.filter((b) => b.websiteStatus === "none").length;
    const social = results.filter((b) => b.websiteStatus === "social").length;
    return { total: results.length, none, social };
  }, [results]);

  const uncheckedSites = results.filter((b) => b.websiteStatus === "website" && !checks[b.id]).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold">Find businesses that need a website</h1>
        <p className="mt-1 text-sm text-slate-500">Search Google Maps for any business type in any city. We flag the ones with no website or a slow one.</p>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Business type, e.g. Bakeries"
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City or area, e.g. Kochi"
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading && !nextToken ? "Searching…" : "Find leads"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700">
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <label htmlFor="myname" className="text-slate-500">Your name (for pitch messages):</label>
          <input
            id="myname"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="e.g. Rouf"
            className="w-48 rounded-md border border-slate-300 px-2 py-1 outline-none focus:border-indigo-500"
          />
        </div>

        {error && <ErrorNote message={error} className="mt-4" />}
      </section>

      {results.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <b>{stats.total}</b> businesses for “{query}” · <b className="text-red-600">{stats.none}</b> with no website ·{" "}
              <b className="text-orange-600">{stats.social}</b> social-only
            </p>
            <div className="flex flex-wrap gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
                <option value="all">Show all</option>
                <option value="hot">🔥 Hot leads only</option>
                <option value="nowebsite">No website / social only</option>
              </select>
              {uncheckedSites > 0 && (
                <button onClick={checkAll} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                  Check all {uncheckedSites} websites
                </button>
              )}
            </div>
          </div>

          <ul className="space-y-3">
            {scored.map(({ b, s }) => {
              const c = checks[b.id];
              const isSaved = saved.has(b.id);
              return (
                <li key={b.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <HeatBadge heat={s.heat} score={s.score} />
                        <h2 className="font-semibold">{b.name}</h2>
                        <WebsiteBadge status={b.websiteStatus} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{b.address}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {b.rating !== null && <>⭐ {b.rating} ({b.reviews.toLocaleString("en-IN")} reviews) · </>}
                        {b.phone ? <a href={`tel:${b.intlPhone || b.phone}`} className="hover:underline">📞 {b.phone}</a> : "No phone listed"}
                        {b.website && (
                          <>
                            {" · "}
                            <a href={b.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                              {b.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                            </a>
                          </>
                        )}
                        {b.mapsUrl && (
                          <>
                            {" · "}
                            <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline">Maps</a>
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">Why: {s.reason}</p>

                      {c && c !== "loading" && c.issues.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-xs text-red-700">
                          {c.issues.map((i) => <li key={i}>{i}</li>)}
                        </ul>
                      )}
                      {c && c !== "loading" && c.issues.length === 0 && <p className="mt-2 text-xs text-emerald-700">✓ Website checked – no major issues</p>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {b.websiteStatus === "website" && !c && (
                        <button onClick={() => checkSite(b)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Check website</button>
                      )}
                      {c === "loading" && <span className="px-3 py-1.5 text-sm text-slate-500">Checking… (up to 30s)</span>}
                      <button
                        onClick={() => setPitching(b)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        ✨ AI pitch
                      </button>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(pitchFor(b));
                          setCopied(b.id);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        {copied === b.id ? "Copied!" : "Quick pitch"}
                      </button>
                      <button
                        onClick={() => {
                          save(b);
                          router.push(`/report/${encodeURIComponent(b.id)}`);
                        }}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        Audit report
                      </button>
                      <button
                        onClick={() => save(b)}
                        disabled={isSaved}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {isSaved ? "Saved ✓" : "Save lead"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {nextToken && (
            <div className="text-center">
              <button onClick={() => search(nextToken)} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
                {loading ? "Loading…" : "Load 20 more"}
              </button>
            </div>
          )}
        </section>
      )}

      {pitching && (
        <PitchModal
          business={pitching}
          siteCheck={(() => {
            const c = checks[pitching.id];
            return c && c !== "loading" ? c : null;
          })()}
          onClose={() => setPitching(null)}
        />
      )}
    </div>
  );
}
