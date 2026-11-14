import { LogoMark } from "@/components/Logo";

/** Branded screen shown while a page or the login check is still loading. */
export default function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24 text-center animate-fade">
      <LogoMark className="h-11 w-11" />
      <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-400">
        {label}
        <span className="dot-1 inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="dot-2 inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="dot-3 inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
      </p>
    </div>
  );
}
