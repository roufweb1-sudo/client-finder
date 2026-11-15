"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { markOnboarded } from "@/lib/onboarding";
import { saveProfileNow, useLeadsLoaded, useProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

/**
 * The first screen after signing up. Pitches and reports go out in the user's
 * name, so asking for that name here - once - beats letting them send a pitch
 * signed "[Your Name]" and only then discovering the branding page.
 */
export default function WelcomePage() {
  const loaded = useLeadsLoaded();
  const profile = useProfile();
  if (!loaded) return <p className="py-20 text-center text-slate-400">Setting up your account…</p>;
  return <WelcomeForm saved={profile} />;
}

function WelcomeForm({ saved }: { saved: Profile }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Profile>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<Profile>) {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  }

  function leave() {
    markOnboarded();
    router.replace("/");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    const err = await saveProfileNow({ ...draft, name: draft.name.trim(), brand: draft.brand.trim(), phone: draft.phone.trim() });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    leave();
  }

  const field = (key: "name" | "brand" | "phone", label: string, placeholder: string, hint: string, type = "text") => (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
      <span className="mt-1 block text-xs text-slate-400">{hint}</span>
    </label>
  );

  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <div className="text-center">
        <Logo className="justify-center" markClass="h-10 w-10" />
        <h1 className="mt-4 text-2xl font-bold">Welcome — let&apos;s sign your pitches properly</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Every pitch and audit report goes out in your name. Fill this in once and you never think about it again.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {field("name", "Your name", "e.g. Abdul Rouf", "Signed at the bottom of every message.")}
        {field("brand", "Business / brand name", "e.g. Roufweb Solutions", "Optional. Shown on your audit reports.")}
        {field("phone", "Your WhatsApp number", "e.g. +91 87140 59090", "Optional. So leads can reach you from the report.", "tel")}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Couldn&apos;t save: {error}</p>}

        <button
          type="submit"
          disabled={!draft.name.trim() || saving}
          className="btn-shine flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {saving ? "Saving…" : "Start finding leads"}
          {!saving && <Icon name="arrow" className="size-4" />}
        </button>

        <button type="button" onClick={leave} className="block w-full py-2 text-center text-sm text-slate-400 hover:text-slate-700">
          Skip for now
        </button>
        <p className="text-center text-xs text-slate-400">You can change all of this later under Settings.</p>
      </form>
    </div>
  );
}
