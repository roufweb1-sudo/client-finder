"use client";

import Icon from "@/components/Icon";
import { useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import UsageBar from "@/components/UsageBar";
import { refreshAccount, useAccount } from "@/lib/account";
import { KIND_LABEL, PRICES, planLines, type Period, type UsageKind } from "@/lib/plans";
import { authFetch, useAuth } from "@/lib/storage";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const FEATURES = ["Hot-lead score & website checks", "Branded audit PDF reports", "AI pitches in English, മലയാളം & Manglish", "WhatsApp and email outreach"];


/** One feature line with our check icon. */
function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
      <span>{children}</span>
    </li>
  );
}

export default function PlansPage() {
  const account = useAccount();
  const { email } = useAuth();
  const [busy, setBusy] = useState<Period | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void refreshAccount();
  }, []);

  async function buy(period: Period) {
    setError(null);
    setSuccess(null);
    setBusy(period);
    try {
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Could not load Razorpay. Check your internet connection.");
      const res = await authFetch("/api/payments/order", { period });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not start the payment");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Client Finder",
        description: period === "yearly" ? "Pro – 1 year" : "Pro – 1 month",
        prefill: { email: email ?? undefined },
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setBusy(null) },
        handler: async (resp: RazorpayResponse) => {
          try {
            const v = await authFetch("/api/payments/verify", resp);
            const json = await v.json();
            if (!v.ok) throw new Error(json.error || "Verification failed");
            await refreshAccount();
            setSuccess(`Payment successful. You are on Pro (${period}).`);
          } catch (e) {
            setError(`${(e as Error).message}. If money was deducted, contact support with payment ID ${resp.razorpay_payment_id}.`);
          } finally {
            setBusy(null);
          }
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "Payment failed. No money was taken.");
        setBusy(null);
      });
      rzp.open();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  const isPro = account?.plan === "pro";
  const expires = account?.expiresAt ? new Date(account.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="mt-2 text-slate-500">Find more clients for less than the cost of one coffee a week.</p>
      </div>

      {success && <p className="mx-auto max-w-xl rounded-lg bg-emerald-50 px-4 py-3 text-center font-medium text-emerald-800">{success}</p>}
      {error && <ErrorNote message={error} className="mx-auto max-w-xl" />}

      {/* Current plan & usage */}
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">
            Your plan:{" "}
            <span className={`rounded-full px-2.5 py-0.5 text-sm ${isPro ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"}`}>
              {account ? (isPro ? `Pro (${account.period})` : "Free") : "…"}
            </span>
          </p>
          {isPro && expires && <p className="text-sm text-slate-500">Active until {expires}</p>}
        </div>
        <p className="mt-1 text-xs text-slate-400">Usage this month (resets on the 1st)</p>
        <div className="mt-4 space-y-3">
          {account ? (
            (Object.keys(KIND_LABEL) as UsageKind[]).map((k) => <UsageBar key={k} kind={k} used={account.usage[k]} limit={account.limits[k]} />)
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </div>
      </section>

      {/* Plan cards */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">Free</h2>
          <p className="mt-2 text-3xl font-bold">₹0</p>
          <p className="text-sm text-slate-500">to try it out</p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            {planLines("free").map((f) => (
              <Tick key={f}>{f}</Tick>
            ))}
          </ul>
          <p className="mt-6 rounded-lg bg-slate-50 py-2 text-center text-sm text-slate-500">{isPro ? "—" : "Your current plan"}</p>
        </div>

        {(["monthly", "yearly"] as const).map((period) => {
          const p = PRICES[period];
          const best = period === "yearly";
          return (
            <div key={period} className={`relative rounded-2xl bg-white p-6 shadow-sm ${best ? "ring-2 ring-violet-600" : "ring-1 ring-slate-200"}`}>
              {best && <span className="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">Best value · save 44%</span>}
              <h2 className="text-lg font-bold">Pro {best ? "Yearly" : "Monthly"}</h2>
              <p className="mt-2 text-3xl font-bold">
                {best ? "₹1,999" : "₹299"}
                <span className="text-base font-normal text-slate-500">{best ? " / year" : " / month"}</span>
              </p>
              <p className="text-sm text-slate-500">{best ? `just ${p.perMonth}/month` : "cancel anytime: no auto-debit"}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {planLines("pro").map((f) => (
                  <Tick key={f}>{f}</Tick>
                ))}
                {FEATURES.map((f) => (
                  <Tick key={f}>{f}</Tick>
                ))}
              </ul>
              <button
                onClick={() => buy(period)}
                disabled={busy !== null}
                className={`btn-shine mt-6 w-full rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-60 ${best ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                {busy === period ? "Opening payment…" : isPro ? `Extend by ${best ? "1 year" : "1 month"}` : `Upgrade · ${p.label}`}
              </button>
            </div>
          );
        })}
      </section>

      <p className="text-center text-xs text-slate-400">
        Secure payment by Razorpay: UPI, cards, net banking. One-time payment, no auto-debit.
      </p>
    </div>
  );
}
