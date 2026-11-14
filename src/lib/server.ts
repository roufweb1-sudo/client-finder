// SERVER ONLY. Uses the Supabase secret key, which must never reach the browser.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { LIMITS, type AccountInfo, type Period, type PlanId, type UsageKind } from "./plans";

let admin: SupabaseClient | null = null;

export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("SUPABASE_SECRET_KEY is missing. Add it to .env.local and restart the app.");
  if (!admin) admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

function monthStart(): string {
  // calendar month in India time
  const now = new Date(Date.now() + 5.5 * 3600_000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getAccount(userId: string): Promise<AccountInfo> {
  const db = adminDb();
  const [acc, use] = await Promise.all([
    db.from("accounts").select("plan,plan_period,plan_expires_at").eq("user_id", userId).maybeSingle(),
    db.from("usage").select("searches,pitches,checks").eq("user_id", userId).eq("month", monthStart()).maybeSingle(),
  ]);
  if (acc.error) throw new Error(acc.error.message);
  const a = acc.data as { plan: PlanId; plan_period: Period | null; plan_expires_at: string | null } | null;
  const active = a?.plan === "pro" && !!a.plan_expires_at && new Date(a.plan_expires_at) > new Date();
  const plan: PlanId = active ? "pro" : "free";
  const u = (use.data as Record<UsageKind, number> | null) ?? { searches: 0, pitches: 0, checks: 0 };
  return {
    plan,
    period: active ? (a?.plan_period ?? null) : null,
    expiresAt: a?.plan_expires_at ?? null,
    usage: { searches: u.searches ?? 0, pitches: u.pitches ?? 0, checks: u.checks ?? 0 },
    limits: LIMITS[plan],
  };
}

const UPGRADE_MSG: Record<UsageKind, string> = {
  searches: "lead searches",
  pitches: "AI pitches",
  checks: "website checks",
};

/** Use one unit of the user's monthly allowance. Returns null if OK, or an error Response if the limit is reached. */
export async function consume(userId: string, kind: UsageKind): Promise<Response | null> {
  const account = await getAccount(userId);
  const limit = account.limits[kind];
  const { data, error } = await adminDb().rpc("consume_usage", { p_user: userId, p_kind: kind, p_limit: limit });
  if (error) return Response.json({ error: `Usage check failed: ${error.message}` }, { status: 500 });
  if (data === -1) {
    const msg =
      account.plan === "free"
        ? `You've used all ${limit} free ${UPGRADE_MSG[kind]} this month. Upgrade to Pro on the Plans page to keep going.`
        : `You've used all ${limit} ${UPGRADE_MSG[kind]} for this month. Your allowance resets on the 1st.`;
    return Response.json({ error: msg, upgrade: account.plan === "free" }, { status: 402 });
  }
  return null;
}

/** Give a unit back when the paid API call failed. */
export async function refund(userId: string, kind: UsageKind) {
  await adminDb().rpc("refund_usage", { p_user: userId, p_kind: kind });
}

/** Activate or extend Pro after a successful payment. */
export async function grantPro(userId: string, period: Period, days: number) {
  const db = adminDb();
  const { data } = await db.from("accounts").select("plan,plan_expires_at").eq("user_id", userId).maybeSingle();
  const current = data?.plan_expires_at ? new Date(data.plan_expires_at as string) : null;
  const start = current && current > new Date() ? current : new Date();
  const expires = new Date(start.getTime() + days * 86400_000);
  const { error } = await db
    .from("accounts")
    .upsert({ user_id: userId, plan: "pro", plan_period: period, plan_expires_at: expires.toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return expires;
}
