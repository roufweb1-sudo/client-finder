"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import PageLoader from "@/components/PageLoader";
import { startAuth, useAuth, useStorageError } from "@/lib/storage";

const noop = () => () => {};

/** Pages anyone may read without logging in. */
const PUBLIC = new Set(["/", "/privacy", "/terms", "/refund", "/contact"]);

/** Sends visitors who aren't logged in to the login page, except on the public pages above. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const error = useStorageError();
  const onLogin = path === "/login";
  const isPublic = PUBLIC.has(path);
  // false on the server and during the browser's first (hydration) render, true afterwards,
  // so both always start from the same loading screen
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    startAuth();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session && !onLogin && !isPublic) router.replace("/login");
    if (session && onLogin) router.replace("/");
  }, [ready, session, onLogin, isPublic, router]);

  // The page is always rendered (Next.js needs that), but kept hidden until we know the user may see it
  const show = hydrated && ready && (onLogin ? !session : isPublic || !!session);

  return (
    <>
      {!show && <PageLoader />}
      {show && session && error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 print:hidden">Couldn&apos;t save to the database: {error}</p>
      )}
      <div hidden={!show}>{children}</div>
    </>
  );
}
