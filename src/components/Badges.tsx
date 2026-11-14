import type { Heat } from "@/lib/score";
import type { WebsiteStatus } from "@/lib/types";

export function HeatBadge({ heat, score }: { heat: Heat; score: number }) {
  const style =
    heat === "hot"
      ? "bg-red-100 text-red-700 ring-red-200"
      : heat === "warm"
        ? "bg-amber-100 text-amber-800 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  const label = heat === "hot" ? "🔥 Hot" : heat === "warm" ? "Warm" : "Cold";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}>
      {label} <span className="font-normal opacity-70">{score}</span>
    </span>
  );
}

export function WebsiteBadge({ status }: { status: WebsiteStatus }) {
  if (status === "none") return <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">No website</span>;
  if (status === "social") return <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">Social only</span>;
  return <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Has website</span>;
}
