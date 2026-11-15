"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import Icon from "@/components/Icon";
import Spinner from "@/components/Spinner";
import { refreshAccount } from "@/lib/account";
import { whatsappNumber } from "@/lib/score";
import { authFetch, useProfile } from "@/lib/storage";
import type { FollowUpStep, Lead, PitchLanguage, PitchTone } from "@/lib/types";

const PREFS_KEY = "cf_pitch_prefs"; // shared with the first-pitch window

type Prefs = { language: PitchLanguage; tone: PitchTone };

function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return { language: "english", tone: "friendly", ...saved };
  } catch {
    return { language: "english", tone: "friendly" };
  }
}

const STEPS: { id: FollowUpStep; label: string; hint: string; days: number }[] = [
  { id: "nudge", label: "1 · Quick nudge", hint: "A few days later. Short, no pressure.", days: 4 },
  { id: "value", label: "2 · Give value", hint: "About a week later. A free idea they can use.", days: 7 },
  { id: "last", label: "3 · Close the file", hint: "Two weeks later. Polite goodbye — replies best.", days: 14 },
];

function daysSince(iso: string | undefined) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((Date.now() - then) / 86400_000));
}

/** Suggests which message is due, based on how long the lead has been sitting. */
function suggestStep(lead: Lead): FollowUpStep {
  const d = daysSince(lead.savedAt) ?? 0;
  if (d >= 12) return "last";
  if (d >= 6) return "value";
  return "nudge";
}

type Props = {
  lead: Lead;
  onClose: () => void;
  /** Called when the message is sent, with the number of days until the next follow-up. */
  onSent?: (nextInDays: number) => void;
};

export default function FollowUpModal({ lead, onClose, onSent }: Props) {
  const profile = useProfile();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [step, setStep] = useState<FollowUpStep>(() => suggestStep(lead));
  const [context, setContext] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const wa = whatsappNumber(lead);
  const current = STEPS.find((s) => s.id === step) ?? STEPS[0];

  const generate = useCallback(
    async (p: Prefs, s: FollowUpStep, note: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/followup", {
          business: lead,
          siteCheck: lead.siteCheck ?? null,
          profile,
          language: p.language,
          tone: p.tone,
          step: s,
          context: note,
          daysSince: daysSince(lead.savedAt),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not write the follow-up");
        setText(json.message);
        void refreshAccount();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [lead, profile],
  );

  // Write the suggested message as soon as the window opens
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void generate(prefs, step, "");
  }, [generate, prefs, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function changePrefs(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadPrefs(), ...next }));
    } catch {
      /* ignore */
    }
    void generate(next, step, context);
  }

  function changeStep(s: FollowUpStep) {
    setStep(s);
    void generate(prefs, s, context);
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
      active ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 p-0 sm:place-items-center sm:p-4 print:hidden"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-label={`Follow-up message for ${lead.name}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600">
              <Icon name="chat" className="h-3.5 w-3.5" />
              Follow-up
            </p>
            <h2 className="truncate font-bold">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Close">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <button key={s.id} disabled={loading} onClick={() => changeStep(s.id)} className={chip(step === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{current.hint}</p>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-slate-500">Language</span>
            {(["english", "malayalam", "manglish"] as const).map((l) => (
              <button key={l} disabled={loading} onClick={() => changePrefs({ language: l })} className={chip(prefs.language === l)}>
                {l === "english" ? "English" : l === "malayalam" ? "മലയാളം" : "Manglish"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-slate-500">Tone</span>
            {(["friendly", "professional"] as const).map((t) => (
              <button key={t} disabled={loading} onClick={() => changePrefs({ tone: t })} className={chip(prefs.tone === t)}>
                {t === "friendly" ? "Friendly" : "Professional"}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-600">What happened? (optional — makes it personal)</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onBlur={() => context.trim() && !loading && generate(prefs, step, context)}
            placeholder='e.g. "said send price later" or "owner asked to call after Diwali"'
            maxLength={400}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500"
          />
        </label>

        <div className="relative mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={loading ? "" : "Your follow-up will appear here"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed outline-none focus:border-violet-400 focus:bg-white"
          />
          {loading && (
            <div className="animate-fade absolute inset-0 grid place-items-center rounded-xl bg-white/75 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-violet-500" />
                Writing follow-up {STEPS.findIndex((s) => s.id === step) + 1}…
              </span>
            </div>
          )}
        </div>
        {error && <ErrorNote message={error} className="mt-2" />}
        <p className="mt-1 text-xs text-slate-400">Edit anything before you send it.</p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={() => generate(prefs, step, context)}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
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
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          {wa ? (
            <a
              href={text && !loading ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSent?.(step === "last" ? 0 : step === "nudge" ? 5 : 7)}
              aria-disabled={!text || loading}
              className={`btn-shine inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 ${
                !text || loading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <Icon name="chat" className="h-4 w-4" />
              Send on WhatsApp
            </a>
          ) : (
            <span className="px-2 py-2 text-xs text-slate-400">No mobile number listed: copy the message instead</span>
          )}
        </div>
      </div>
    </div>
  );
}
