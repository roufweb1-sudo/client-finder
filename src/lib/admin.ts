// Types shared by the admin API and the admin page

import type { Period, UsageKind } from "./plans";

export type AdminUser = {
  id: string;
  email: string;
  provider: string; // google, email...
  createdAt: string;
  lastSignInAt: string | null;
  plan: "free" | "pro"; // effective plan right now
  period: Period | null;
  expiresAt: string | null;
  usage: Record<UsageKind, number>; // this month
  leads: number;
  paidPaise: number; // total paid so far
};

export type AdminPayment = {
  id: string;
  userId: string;
  email: string;
  period: Period;
  amountPaise: number;
  status: "created" | "paid" | "failed";
  createdAt: string;
  paidAt: string | null;
  razorpayPaymentId: string | null;
};

export type DayPoint = { day: string; signups: number; revenuePaise: number; paidCount: number };

export type AdminOverview = {
  generatedAt: string;
  testMode: boolean; // Razorpay test keys in use: amounts are not real money
  stats: {
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    activeUsers30d: number; // signed in during the last 30 days
    proUsers: number;
    proMonthly: number;
    proYearly: number;
    conversionPct: number; // pro / total
    revenueTotalPaise: number;
    revenueThisMonthPaise: number;
    revenue30dPaise: number;
    paidPayments: number;
    mrrPaise: number; // estimated monthly recurring revenue from active Pro users
    totalLeads: number;
    usageThisMonth: Record<UsageKind, number>;
    usageAllTime: Record<UsageKind, number>;
  };
  daily: DayPoint[]; // last 30 days, oldest first (India time)
  users: AdminUser[];
  payments: AdminPayment[]; // newest first
};
