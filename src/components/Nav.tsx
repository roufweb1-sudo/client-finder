"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { clearAccount, refreshAccount, useAccount } from "@/lib/account";
import { signOut, useAuth, useLeads } from "@/lib/storage";

export default function Nav() {
  const path = usePathname();
  const count = useLeads().length;
  const { session } = useAuth();
  const account = useAccount();
  const userId = session?.user.id;

  useEffect(() => {
    if (userId) void refreshAccount();
    else clearAccount();
  }, [userId]);

  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        path === href ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="AI Client Finder home" className="shrink-0">
          <Logo markClass="h-8 w-8" />
        </Link>

        {session ? (
          <nav className="flex flex-wrap items-center justify-end gap-1">
            {link("/", "Find leads")}
            {link("/leads", `My leads${count ? ` (${count})` : ""}`)}
            {link("/settings", "My branding")}
            {account?.isAdmin && link("/admin", "Admin")}
            <Link
              href="/plans"
              className={`ml-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                account?.plan === "pro" ? "bg-violet-600 text-white" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
              }`}
            >
              {account?.plan === "pro" ? "PRO" : "Free · Upgrade"}
            </Link>
            <button
              onClick={() => signOut()}
              className="ml-1 rounded-lg px-2.5 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Log out"
            >
              <Icon name="lock" className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-1">
            <Link href="/#pricing" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
              Pricing
            </Link>
            <Link href="/contact" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
              Contact
            </Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Log in
            </Link>
            <Link
              href="/login"
              className="btn-shine rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              Start free
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
