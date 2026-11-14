"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { clearAccount, refreshAccount, useAccount } from "@/lib/account";
import { signOut, useAuth, useLeads } from "@/lib/storage";

export default function Nav() {
  const path = usePathname();
  const count = useLeads().length;
  const { session, email } = useAuth();
  const account = useAccount();
  const userId = session?.user.id;

  useEffect(() => {
    if (userId) void refreshAccount();
    else clearAccount();
  }, [userId]);

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${path === href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">CF</span>
          <span className="text-lg font-bold text-slate-900">Client Finder</span>
        </Link>
        {session && (
          <nav className="flex flex-wrap items-center gap-1">
            {link("/", "Find leads")}
            {link("/leads", `My leads${count ? ` (${count})` : ""}`)}
            {link("/settings", "My branding")}
            {account?.isAdmin && link("/admin", "Admin")}
            <Link
              href="/plans"
              className={`ml-1 rounded-full px-3 py-1 text-xs font-semibold ${account?.plan === "pro" ? "bg-indigo-600 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}`}
            >
              {account?.plan === "pro" ? "PRO" : "Free · Upgrade"}
            </Link>
            <span className="ml-2 hidden text-xs text-slate-400 md:inline">{email}</span>
            <button onClick={() => signOut()} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
