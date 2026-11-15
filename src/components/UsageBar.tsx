import { KIND_LABEL, type UsageKind } from "@/lib/plans";

/** One month's usage for a single allowance, shown as a filled bar. */
export default function UsageBar({ kind, used, limit }: { kind: UsageKind; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{KIND_LABEL[kind]}</span>
        <span className="font-medium text-slate-800 tabular-nums">
          {used} / {limit.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
