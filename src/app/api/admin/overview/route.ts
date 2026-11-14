import type { AdminOverview, AdminPayment, AdminUser, DayPoint } from "@/lib/admin";
import { PRICES, type Period, type UsageKind } from "@/lib/plans";
import { adminDb, adminFromRequest } from "@/lib/server";

const IST = 5.5 * 3600_000;
/** YYYY-MM-DD in India time */
const istDay = (d: Date | string) => new Date(new Date(d).getTime() + IST).toISOString().slice(0, 10);
const ZERO = (): Record<UsageKind, number> => ({ searches: 0, pitches: 0, checks: 0 });

type AccountRow = { user_id: string; plan: string; plan_period: Period | null; plan_expires_at: string | null };
type UsageRow = { user_id: string; month: string; searches: number; pitches: number; checks: number };
type PaymentRow = {
  id: string;
  user_id: string;
  razorpay_payment_id: string | null;
  plan_period: Period;
  amount: number;
  status: "created" | "paid" | "failed";
  created_at: string;
  paid_at: string | null;
};

/** Read every row of a table, 1,000 at a time (Supabase's page size). */
async function all<T>(table: string, columns: string, order: string): Promise<T[]> {
  const db = adminDb();
  const out: T[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await db.from(table).select(columns).order(order).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function allAuthUsers() {
  const db = adminDb();
  const out: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; app_metadata?: { provider?: string } }[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`users: ${error.message}`);
    out.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return out;
}

// Everything the admin dashboard shows, in one call. Admins only.
export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  try {
    const [authUsers, accounts, usage, payments, leads] = await Promise.all([
      allAuthUsers(),
      all<AccountRow>("accounts", "user_id,plan,plan_period,plan_expires_at", "user_id"),
      all<UsageRow>("usage", "user_id,month,searches,pitches,checks", "user_id"),
      all<PaymentRow>("payments", "id,user_id,razorpay_payment_id,plan_period,amount,status,created_at,paid_at", "created_at"),
      all<{ user_id: string }>("leads", "user_id", "user_id"),
    ]);

    const now = new Date();
    const today = istDay(now);
    const thisMonth = today.slice(0, 7); // YYYY-MM
    const ago = (days: number) => now.getTime() - days * 86400_000;

    const accountOf = new Map(accounts.map((a) => [a.user_id, a]));
    const emailOf = new Map(authUsers.map((u) => [u.id, u.email ?? "(no email)"]));

    const leadsOf = new Map<string, number>();
    for (const l of leads) leadsOf.set(l.user_id, (leadsOf.get(l.user_id) ?? 0) + 1);

    const usageNow = new Map<string, Record<UsageKind, number>>();
    const usageThisMonth = ZERO();
    const usageAllTime = ZERO();
    for (const u of usage) {
      for (const k of ["searches", "pitches", "checks"] as UsageKind[]) {
        usageAllTime[k] += u[k] ?? 0;
        if (u.month.slice(0, 7) === thisMonth) usageThisMonth[k] += u[k] ?? 0;
      }
      if (u.month.slice(0, 7) === thisMonth) usageNow.set(u.user_id, { searches: u.searches, pitches: u.pitches, checks: u.checks });
    }

    const paid = payments.filter((p) => p.status === "paid");
    const paidOf = new Map<string, number>();
    for (const p of paid) paidOf.set(p.user_id, (paidOf.get(p.user_id) ?? 0) + p.amount);

    const users: AdminUser[] = authUsers
      .map((u) => {
        const a = accountOf.get(u.id);
        const active = a?.plan === "pro" && !!a.plan_expires_at && new Date(a.plan_expires_at) > now;
        return {
          id: u.id,
          email: u.email ?? "(no email)",
          provider: u.app_metadata?.provider ?? "email",
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          plan: active ? ("pro" as const) : ("free" as const),
          period: active ? (a?.plan_period ?? null) : null,
          expiresAt: a?.plan_expires_at ?? null,
          usage: usageNow.get(u.id) ?? ZERO(),
          leads: leadsOf.get(u.id) ?? 0,
          paidPaise: paidOf.get(u.id) ?? 0,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // last 30 days, oldest first
    const days = new Map<string, DayPoint>();
    for (let i = 29; i >= 0; i--) {
      const day = istDay(new Date(ago(i)));
      days.set(day, { day, signups: 0, revenuePaise: 0, paidCount: 0 });
    }
    for (const u of users) {
      const d = days.get(istDay(u.createdAt));
      if (d) d.signups++;
    }
    for (const p of paid) {
      const d = days.get(istDay(p.paid_at ?? p.created_at));
      if (d) {
        d.revenuePaise += p.amount;
        d.paidCount++;
      }
    }

    const pro = users.filter((u) => u.plan === "pro");
    const proMonthly = pro.filter((u) => u.period === "monthly").length;
    const proYearly = pro.filter((u) => u.period === "yearly").length;
    const sum = (rows: PaymentRow[]) => rows.reduce((t, p) => t + p.amount, 0);
    const paidAt = (p: PaymentRow) => p.paid_at ?? p.created_at;

    const adminPayments: AdminPayment[] = payments
      .map((p) => ({
        id: p.id,
        userId: p.user_id,
        email: emailOf.get(p.user_id) ?? "(deleted user)",
        period: p.plan_period,
        amountPaise: p.amount,
        status: p.status,
        createdAt: p.created_at,
        paidAt: p.paid_at,
        razorpayPaymentId: p.razorpay_payment_id,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 500);

    const overview: AdminOverview = {
      generatedAt: now.toISOString(),
      testMode: (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_"),
      stats: {
        totalUsers: users.length,
        newUsers7d: users.filter((u) => new Date(u.createdAt).getTime() >= ago(7)).length,
        newUsers30d: users.filter((u) => new Date(u.createdAt).getTime() >= ago(30)).length,
        activeUsers30d: users.filter((u) => u.lastSignInAt && new Date(u.lastSignInAt).getTime() >= ago(30)).length,
        proUsers: pro.length,
        proMonthly,
        proYearly,
        conversionPct: users.length ? Math.round((pro.length / users.length) * 1000) / 10 : 0,
        revenueTotalPaise: sum(paid),
        revenueThisMonthPaise: sum(paid.filter((p) => istDay(paidAt(p)).slice(0, 7) === thisMonth)),
        revenue30dPaise: sum(paid.filter((p) => new Date(paidAt(p)).getTime() >= ago(30))),
        paidPayments: paid.length,
        mrrPaise: Math.round(proMonthly * PRICES.monthly.amountPaise + (proYearly * PRICES.yearly.amountPaise) / 12),
        totalLeads: leads.length,
        usageThisMonth,
        usageAllTime,
      },
      daily: [...days.values()],
      users,
      payments: adminPayments,
    };
    return Response.json(overview);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
