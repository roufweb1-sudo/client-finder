// Plan definitions shared by the server and the browser. Change prices/limits here.

export type PlanId = "free" | "pro";
export type Period = "monthly" | "yearly";
export type UsageKind = "searches" | "pitches" | "checks";

/**
 * One search is one Google Places request, which returns up to this many
 * businesses. Google bills per request, not per business, so the search is the
 * unit we meter - but "3 searches" means nothing to a user, so every screen
 * shows the lead count instead.
 */
export const LEADS_PER_SEARCH = 20;

export const LIMITS: Record<PlanId, Record<UsageKind, number>> = {
  free: { searches: 3, pitches: 15, checks: 50 },
  pro: { searches: 50, pitches: 500, checks: 2000 },
};

/** The plan's headline: how many leads it can turn up in a month. */
export function leadsPerMonth(plan: PlanId): number {
  return LIMITS[plan].searches * LEADS_PER_SEARCH;
}

/** The feature bullets, so the landing page and the plans page can never drift apart. */
export function planLines(plan: PlanId): string[] {
  const l = LIMITS[plan];
  return [
    `Up to ${leadsPerMonth(plan).toLocaleString("en-IN")} new leads a month (${l.searches} searches × ${LEADS_PER_SEARCH})`,
    `${l.pitches} AI pitches and follow-ups`,
    `${l.checks.toLocaleString("en-IN")} website speed checks`,
    plan === "pro" ? "Branded PDF audit reports" : "Lead tracker, CRM and CSV export",
  ];
}

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
