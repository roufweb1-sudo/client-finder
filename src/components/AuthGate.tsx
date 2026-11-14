"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { startAuth, useAuth, useStorageError } from "@/lib/storage";

const noop = () => () => {};

/** Shows the login page to visitors who aren't logged in, and the app to those who are. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const error = useStorageError();
  const onLogin = path === "/login";
  // false on the server and during the browser's first (hydration) render, true afterwards,
  // so both always start from the same "Loading…" screen
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    startAuth();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session && !onLogin) router.replace("/login");
    if (session && onLogin) router.replace("/");
  }, [ready, session, onLogin, router]);

  // The page is always rendered (Next.js needs that), but kept hidden until we know the user may see it
  const show = hydrated && ready && (onLogin ? !session : !!session);

  return (
    <>
      {!show && <p className="py-20 text-center text-slate-400">Loading…</p>}
      {show && error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 print:hidden">Couldn&apos;t save to the database: {error}</p>
      )}
      <div hidden={!show}>{children}</div>
    </>
  );
}
