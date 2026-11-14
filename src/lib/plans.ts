// Plan definitions shared by the server and the browser. Change prices/limits here.

export type PlanId = "free" | "pro";
export type Period = "monthly" | "yearly";
export type UsageKind = "searches" | "pitches" | "checks";

export const LIMITS: Record<PlanId, Record<UsageKind, number>> = {
  free: { searches: 3, pitches: 10, checks: 30 },
  pro: { searches: 25, pitches: 300, checks: 1000 },
};

export const PRICES: Record<Period, { amountPaise: number; days: number; label: string; perMonth: string }> = {
  monthly: { amountPaise: 299_00, days: 30, label: "₹299 / month", perMonth: "₹299" },
  yearly: { amountPaise: 1999_00, days: 365, label: "₹1,999 / year", perMonth: "₹167" },
};

export const KIND_LABEL: Record<UsageKind, string> = {
  searches: "Lead searches",
  pitches: "AI pitches",
  checks: "Website checks",
};

export type AccountInfo = {
  plan: PlanId; // effective plan right now
  period: Period | null;
  expiresAt: string | null;
  usage: Record<UsageKind, number>;
  limits: Record<UsageKind, number>;
  isAdmin?: boolean; // true only for emails listed in ADMIN_EMAILS
};
