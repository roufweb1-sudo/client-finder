"use client";

import Icon from "@/components/Icon";
import Spinner from "@/components/Spinner";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import { refreshAccount } from "@/lib/account";
import { whatsappNumber } from "@/lib/score";
import { authFetch, useProfile } from "@/lib/storage";
import type { Business, PitchGoal, PitchLanguage, PitchTone, SiteCheck } from "@/lib/types";

const PREFS_KEY = "cf_pitch_prefs";

type Prefs = { language: PitchLanguage; tone: PitchTone; goal: PitchGoal };

function loadPrefs(): Prefs {
  try {
    return { language: "english", tone: "friendly", goal: "website", ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return { language: "english", tone: "friendly", goal: "website" };
  }
}

type Props = {
  business: Business;
  siteCheck?: SiteCheck | null;
  onClose: () => void;
  onSent?: () => void; // e.g. mark lead as Contacted
};

export default function PitchModal({ business, siteCheck, onClose, onSent }: Props) {
  const profile = useProfile();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const wa = whatsappNumber(business);

  const generate = useCallback(
    async (p: Prefs) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/pitch", { business, siteCheck: siteCheck ?? null, profile, ...p });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not write the pitch");
        setText(json.message);
        void refreshAccount();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [business, siteCheck, profile],
  );

  // Write the first pitch as soon as the window opens
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void generate(prefs);
  }, [generate, prefs]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function change(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    void generate(next);
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium ring-1 ${active ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 print:hidden" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-label={`AI pitch for ${business.name}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600">
              <Icon name="spark" className="h-3.5 w-3.5" />
              AI pitch
            </p>
            <h2 className="font-bold">{business.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-slate-500">Language</span>
            {(["english", "malayalam", "manglish"] as const).map((l) => (
              <button key={l} disabled={loading} onClick={() => change({ language: l })} className={chip(prefs.language === l)}>
                {l === "english" ? "English" : l === "malayalam" ? "മലയാളം" : "Manglish"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-slate-500">Tone</span>
            {(["friendly", "professional"] as const).map((t) => (
              <button key={t} disabled={loading} onClick={() => change({ tone: t })} className={chip(prefs.tone === t)}>
                {t === "friendly" ? "Friendly" : "Professional"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-slate-500">Offer</span>
            {(["website", "report"] as const).map((g) => (
              <button key={g} disabled={loading} onClick={() => change({ goal: g })} className={chip(prefs.goal === g)}>
                {g === "website" ? "Free sample design" : "Free audit report"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder={loading ? "" : "Your message will appear here"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed outline-none focus:border-violet-400 focus:bg-white"
          />
          {loading && (
            <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/75 text-sm text-slate-500 animate-fade">
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-violet-500" />
                Writing a pitch for {business.name}…
              </span>
            </div>
          )}
        </div>
        {error && <ErrorNote message={error} className="mt-2" />}
        <p className="mt-1 text-xs text-slate-400">You can edit the message before sending.</p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={() => generate(prefs)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50">
            <Icon name="refresh" className="h-4 w-4" />
            Try another
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            disabled={!text || loading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          {wa ? (
            <a
              href={text && !loading ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSent?.()}
              aria-disabled={!text || loading}
              className={`rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 ${!text || loading ? "pointer-events-none opacity-50" : ""}`}
            >
              Open in WhatsApp
            </a>
          ) : (
            <span className="px-2 py-2 text-xs text-slate-400">No mobile number listed: copy the message instead</span>
          )}
        </div>
      </div>
    </div>
  );
}
