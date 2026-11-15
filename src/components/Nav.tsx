"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import { clearAccount, refreshAccount, useAccount } from "@/lib/account";
import { signOut, useAuth, useLeads } from "@/lib/storage";

export default function Nav() {
  const path = usePathname();
  const count = useLeads().length;
  const { session } = useAuth();
  const account = useAccount();
  const userId = session?.user.id;
  const drawer = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (userId) void refreshAccount();
    else clearAccount();
  }, [userId]);

  useEffect(() => {
    drawer.current?.close();
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) drawer.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  function closeMenu() {
    drawer.current?.close();
  }

  const items: { href: string; label: string; icon: IconName; count?: number }[] = session
    ? [
        { href: "/", label: "Find leads", icon: "search" },
        { href: "/leads", label: "My leads", icon: "users", count },
        { href: "/settings", label: "My branding", icon: "sliders" },
        ...(account?.isAdmin ? [{ href: "/admin", label: "Admin", icon: "shield" as const }] : []),
        { href: "/plans", icon: "spark", label: account?.plan === "pro" ? "Pro plan" : "Upgrade to Pro" },
      ]
    : [
        { href: "/#pricing", label: "Pricing", icon: "card" },
        { href: "/contact", label: "Contact", icon: "mail" },
        { href: "/login", label: "Log in", icon: "lock" },
      ];

  function navigation(mobile: boolean) {
    const linkStyle = mobile ? "min-h-12 px-4" : "px-3 py-2";
    return (
      <nav aria-label="Main navigation" className={mobile ? "grid gap-2" : "hidden items-center gap-1 lg:flex"}>
        {items.map(({ href, label, icon, count }) => (
          <Link
            key={href}
            href={href}
            onClick={mobile ? closeMenu : undefined}
            aria-current={path === href ? "page" : undefined}
            className={"flex items-center gap-2 rounded-xl text-sm font-medium transition-colors " + linkStyle + " " + (
              path === href ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Icon name={icon} className="size-4 shrink-0 text-violet-600" />
            <span>{label}</span>
            {count !== undefined && (
              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-semibold tabular-nums text-violet-800 ${mobile ? "ml-auto" : ""}`}>
                {count}<span className="sr-only"> saved leads</span>
              </span>
            )}
          </Link>
        ))}
        {session ? (
          <button
            type="button"
            onClick={() => {
              closeMenu();
              void signOut();
            }}
            className={"flex items-center gap-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 " + linkStyle}
          >
            <Icon name="arrow" className="size-4 shrink-0 text-violet-600" />
            <span className={mobile ? undefined : "sr-only"}>Log out</span>
          </button>
        ) : (
          <Link
            href="/login"
            onClick={mobile ? closeMenu : undefined}
            className={"flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 " + linkStyle}
          >
            <Icon name="arrow" className="size-4 shrink-0" />
            Start free
          </Link>
        )}
      </nav>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="AI Client Finder home" className="flex min-h-11 items-center">
          <Logo markClass="h-8 w-8 shrink-0" />
        </Link>
        {navigation(false)}
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            drawer.current?.showModal();
            setMenuOpen(true);
          }}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700 lg:hidden"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </div>
      <dialog
        ref={drawer}
        id="mobile-navigation"
        aria-labelledby="mobile-navigation-title"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="mobile-navigation fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(22rem,88vw)] max-w-none overflow-y-auto overscroll-contain bg-white shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="min-h-full p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h2 id="mobile-navigation-title" className="font-semibold text-slate-900">Menu</h2>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
          {navigation(true)}
        </div>
      </dialog>
    </header>
  );
}
