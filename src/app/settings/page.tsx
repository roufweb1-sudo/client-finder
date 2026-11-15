"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BrandingForm from "@/components/BrandingForm";
import EmailConnect from "@/components/EmailConnect";
import Icon, { type IconName } from "@/components/Icon";
import UsageBar from "@/components/UsageBar";
import { useAccount } from "@/lib/account";
import { KIND_LABEL, type UsageKind } from "@/lib/plans";
import { signOut, useAuth, useLeads, useLeadsLoaded, useProfile } from "@/lib/storage";

type Tab = "branding" | "email" | "plan" | "account";

const TABS: { id: Tab; label: string; icon: IconName; blurb: string }[] = [
  { id: "branding", label: "My branding", icon: "sliders", blurb: "Your name, logo and contact details on every pitch and report." },
  { id: "email", label: "Email", icon: "mail", blurb: "Connect the mailbox your email pitches are sent from." },
  { id: "plan", label: "Plan & usage", icon: "crown", blurb: "What you are on, and how much of this month you have used." },
  { id: "account", label: "My account", icon: "lock", blurb: "The email you sign in with." },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-slate-400">Loading…</p>}>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const params = useSearchParams();
  const emailResult = params.get("email");
  const [tab, setTab] = useState<Tab>(emailResult ? "email" : "branding");
  const profile = useProfile();
  const loaded = useLeadsLoaded(); // branding loads together with leads
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">{current.blurb}</p>

      <div className="mt-5 gap-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
        {/* Desktop: a side list. Mobile: the same items as a scrollable chip row. */}
        <nav aria-label="Settings sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors lg:w-full lg:justify-start ${
                  active ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 lg:ring-0"
                }`}
              >
                <Icon name={t.icon} className="size-4 shrink-0 text-violet-600" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 lg:mt-0">
          {tab === "branding" && (loaded ? <BrandingForm saved={profile} /> : <p className="py-16 text-center text-slate-400">Loading your branding…</p>)}
          {tab === "email" && <EmailConnect result={emailResult} />}
          {tab === "plan" && <PlanPanel />}
          {tab === "account" && <AccountPanel />}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">{children}</section>;
}

function PlanPanel() {
  const account = useAccount();
  const isPro = account?.plan === "pro";
  const expires = account?.expiresAt
    ? new Date(account.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your plan</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-bold">
              {isPro && <Icon name="crown" className="size-5 text-violet-600" />}
              {account ? (isPro ? `Pro · ${account.period === "yearly" ? "yearly" : "monthly"}` : "Free") : "…"}
            </p>
            {isPro && expires && <p className="mt-1 text-sm text-slate-500">Renews or ends on {expires}</p>}
            {!isPro && account && <p className="mt-1 text-sm text-slate-500">Upgrade for 25 searches and 300 AI pitches a month.</p>}
          </div>
          <Link
            href="/plans"
            className="btn-shine inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
          >
            {isPro ? "Extend plan" : "Upgrade to Pro"}
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This month</p>
        <div className="mt-4 space-y-4">
          {account ? (
            (Object.keys(KIND_LABEL) as UsageKind[]).map((k) => <UsageBar key={k} kind={k} used={account.usage[k]} limit={account.limits[k]} />)
          ) : (
            <p className="text-sm text-slate-400">Loading your usage…</p>
          )}
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Allowances reset on the 1st of each month. A pitch that fails is not counted.
        </p>
      </Card>
    </div>
  );
}

function AccountPanel() {
  const { session } = useAuth();
  const router = useRouter();
  const leads = useLeads().length;
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(false);
  const email = session?.user.email ?? "";
  const joined = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  async function logout() {
    setLoggingOut(true);
    setError(false);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setError(true);
      setLoggingOut(false);
    }
  }

  const row = (label: string, value: string) => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium break-all text-slate-800">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signed in as</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-100 text-base font-bold text-violet-700">
            {(email[0] || "?").toUpperCase()}
          </span>
          <span className="min-w-0 break-all font-medium text-slate-900">{email || "…"}</span>
        </div>
        <div className="mt-4">
          {joined && row("Member since", joined)}
          {row("Saved leads", String(leads))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          You sign in with Google, so there is no password to change here. To use a different address, log out and sign in with that Google account.
        </p>
      </Card>

      <Card>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <Icon name="logout" className="size-4 text-violet-600" />
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
        {error && <p className="mt-2 text-sm text-rose-700">Couldn&apos;t log out. Try again.</p>}
        <p className="mt-3 text-xs text-slate-500">
          Need your account or data removed? Email{" "}
          <a href="mailto:support@aiclientfinderapp.com" className="font-medium text-violet-700 underline">
            support@aiclientfinderapp.com
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
