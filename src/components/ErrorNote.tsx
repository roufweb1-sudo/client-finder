import Link from "next/link";

/** Red error box; adds an "See plans" button when the error is about plan limits. */
export default function ErrorNote({ message, className = "" }: { message: string; className?: string }) {
  const upgrade = /Plans page|allowance/i.test(message);
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ${className}`}>
      <span>{message}</span>
      {upgrade && (
        <Link href="/plans" className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700">
          See plans
        </Link>
      )}
    </div>
  );
}
