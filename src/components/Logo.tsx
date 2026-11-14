/** Our own logo: a lens with three linked nodes inside — "AI that finds clients". */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cf-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11.5" fill="url(#cf-logo-grad)" />
      <circle cx="18" cy="18" r="8.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeOpacity="0.95" />
      <path d="M24.2 24.2 30 30" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M14.8 20.8 18 14.6l3.2 6.2" fill="none" stroke="#fff" strokeWidth="1.3" strokeOpacity="0.75" strokeLinejoin="round" />
      <circle cx="18" cy="14.6" r="1.7" fill="#fff" />
      <circle cx="14.8" cy="20.8" r="1.7" fill="#fff" />
      <circle cx="21.2" cy="20.8" r="1.7" fill="#fff" />
    </svg>
  );
}

export default function Logo({ className = "", markClass = "h-9 w-9" }: { className?: string; markClass?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} />
      <span className="text-[17px] font-semibold tracking-tight text-slate-900">
        <span className="text-violet-600">AI</span> Client Finder
      </span>
    </span>
  );
}
