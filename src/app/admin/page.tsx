"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminUser, DayPoint } from "@/lib/admin";
import { refreshAdmin, setAdminError, useAdmin } from "@/lib/adminData";
import { KIND_LABEL, type UsageKind } from "@/lib/plans";
import { authFetch } from "@/lib/storage";

const KINDS: UsageKind[] = ["searches", "pitches", "checks"];
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const num = (n: number) => n.toLocaleString("en-IN");
const dateOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";
const dateTimeOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
    </div>
  );
}

/** Simple 30-day bar chart. One number per day; hover a bar for the exact value. */
function DayBars({ title, total, points, value, format }: { title: string; total: string; points: DayPoint[]; value: (p: DayPoint) => number; format: (n: number) => string }) {
  const top = Math.max(0, ...points.map(value));
  const max = Math.max(1, top);
  const label = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="text-sm text-slate-500">
          Last 30 days: <b className="text-slate-800">{total}</b>
        </span>
      </div>
      <div className="mt-3 flex h-28 items-end gap-[3px]" role="img" aria-label={`${title}, last 30 days, total ${total}`}>
        {points.map((p) => {
          const v = value(p);
          return (
            <div key={p.day} className="group relative flex h-full flex-1 items-end" title={`${label(p.day)}: ${format(v)}`}>
              <div className={`w-full rounded-t ${v ? "bg-violet-500 group-hover:bg-violet-700" : "bg-slate-200"}`} style={{ height: v ? `${Math.max(6, (v / max) * 100)}%` : "2px" }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{label(points[0].day)}</span>
        <span>Highest day: {format(top)}</span>
        <span>{label(points[points.length - 1].day)}</span>
      </div>
    </div>
  );
}

function downloadCsv(users: AdminUser[]) {
  const head = ["Email", "Plan", "Period", "Pro until", "Joined", "Last login", "Searches (month)", "AI pitches (month)", "Checks (month)", "Saved leads", "Paid (INR)"];
  const rows = users.map((u) => [u.email, u.plan, u.period ?? "", u.expiresAt ?? "", u.createdAt, u.lastSignInAt ?? "", u.usage.searches, u.usage.pitches, u.usage.checks, u.leads, Math.round(u.paidPaise / 100)]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
  a.download = `client-finder-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminPage() {
  const { data, error, denied, loading } = useAdmin();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pro" | "free">("all");
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void refreshAdmin();
  }, []);

  const users = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.users.filter((u) => (filter === "all" || u.plan === filter) && (!q || u.email.toLowerCase().includes(q)));
  }, [data, query, filter]);

  async function act(user: AdminUser, action: "grant" | "revoke", days?: number) {
    const what = action === "grant" ? `Give ${days} days of Pro to ${user.email}?` : `Remove Pro from ${user.email}? They go back to the Free plan now.`;
    if (!window.confirm(what)) return;
    setBusyUser(user.id);
    setNotice(null);
    setAdminError(null);
    try {
      const res = await authFetch("/api/admin/user", { userId: user.id, action, days });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "That didn't work.");
      setNotice(action === "grant" ? `${user.email} now has Pro until ${dateOf(json.expiresAt)}.` : `${user.email} is back on the Free plan.`);
      await refreshAdmin();
    } catch (e) {
      setAdminError((e as Error).message);
    } finally {
      setBusyUser(null);
    }
  }

  if (denied)
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">Admins only</h1>
        <p className="mt-2 text-sm text-slate-600">This page is for the owner of Client Finder.</p>
      </div>
    );
  if (!data)
    return (
      <div className="text-sm text-slate-500">
        {error ? <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{error}</div> : "Loading the dashboard…"}
      </div>
    );

  const s = data.stats;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-sm text-slate-500">Updated {dateTimeOf(data.generatedAt)} · all times in India time</p>
        </div>
        <button
          onClick={() => void refreshAdmin()}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {data.testMode && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Razorpay is in <b>test mode</b>. The earnings below are test payments, not real money.
        </div>
      )}
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Earnings</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Total earned" value={rupees(s.revenueTotalPaise)} note={`${num(s.paidPayments)} paid payment${s.paidPayments === 1 ? "" : "s"}`} />
          <Tile label="This month" value={rupees(s.revenueThisMonthPaise)} />
          <Tile label="Last 30 days" value={rupees(s.revenue30dPaise)} />
          <Tile label="Monthly run rate" value={rupees(s.mrrPaise)} note="From active Pro users (yearly ÷ 12)" />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Users</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Total users" value={num(s.totalUsers)} note={`+${num(s.newUsers7d)} this week · +${num(s.newUsers30d)} in 30 days`} />
          <Tile label="Active in 30 days" value={num(s.activeUsers30d)} note="Logged in at least once" />
          <Tile label="Pro users" value={num(s.proUsers)} note={`${num(s.proMonthly)} monthly · ${num(s.proYearly)} yearly`} />
          <Tile label="Free → Pro" value={`${s.conversionPct}%`} note="Share of users on Pro" />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <DayBars title="New sign-ups per day" total={num(s.newUsers30d)} points={data.daily} value={(p) => p.signups} format={num} />
        <DayBars title="Earnings per day" total={rupees(s.revenue30dPaise)} points={data.daily} value={(p) => p.revenuePaise} format={rupees} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Usage</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KINDS.map((k) => (
            <Tile key={k} label={`${KIND_LABEL[k]} this month`} value={num(s.usageThisMonth[k])} note={`${num(s.usageAllTime[k])} all time`} />
          ))}
          <Tile label="Saved leads" value={num(s.totalLeads)} note="Across all users" />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Users <span className="font-normal text-slate-500">({num(users.length)})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email"
              className="w-52 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "pro" | "free")} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="all">All plans</option>
              <option value="pro">Pro only</option>
              <option value="free">Free only</option>
            </select>
            <button onClick={() => downloadCsv(users)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Last login</th>
                <th className="px-4 py-2 text-right" title="This month: searches / AI pitches / website checks">
                  Use this month
                </th>
                <th className="px-4 py-2 text-right">Leads</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-800">{u.email}</div>
                    <div className="text-xs text-slate-400">via {u.provider}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.plan === "pro" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{u.plan === "pro" ? "PRO" : "Free"}</span>
                    {u.plan === "pro" && (
                      <div className="mt-1 text-xs text-slate-500">
                        {u.period} · until {dateOf(u.expiresAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{dateOf(u.createdAt)}</td>
                  <td className="px-4 py-2 text-slate-600">{dateTimeOf(u.lastSignInAt)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700" title="Searches / AI pitches / website checks">
                    {u.usage.searches} / {u.usage.pitches} / {u.usage.checks}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">{num(u.leads)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">{u.paidPaise ? rupees(u.paidPaise) : "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button disabled={busyUser === u.id} onClick={() => act(u, "grant", 30)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        +30 days Pro
                      </button>
                      <button disabled={busyUser === u.id} onClick={() => act(u, "grant", 365)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        +1 year Pro
                      </button>
                      {u.plan === "pro" && (
                        <button disabled={busyUser === u.id} onClick={() => act(u, "revoke")} className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                          Remove Pro
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Payments <span className="font-normal text-slate-500">({num(data.payments.length)})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Razorpay payment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-slate-600">{dateTimeOf(p.paidAt ?? p.createdAt)}</td>
                  <td className="px-4 py-2 text-slate-800">{p.email}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{p.period}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-800">{rupees(p.amountPaise)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "paid" ? "bg-emerald-100 text-emerald-800" : p.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {p.status === "created" ? "not completed" : p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.razorpayPaymentId ?? "—"}</td>
                </tr>
              ))}
              {!data.payments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
