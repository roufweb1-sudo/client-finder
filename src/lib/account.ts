"use client";

import { useSyncExternalStore } from "react";
import type { AccountInfo } from "./plans";
import { authFetch } from "./storage";

// The user's plan + this month's usage, fetched from our server and kept in memory
let account: AccountInfo | null = null;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

let inflight: Promise<void> | null = null;
export function refreshAccount(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await authFetch("/api/account", {});
      if (res.ok) {
        account = (await res.json()) as AccountInfo;
        listeners.forEach((l) => l());
      }
    } catch {
      /* offline: keep the last value */
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useAccount(): AccountInfo | null {
  return useSyncExternalStore(
    subscribe,
    () => account,
    () => null,
  );
}

export function clearAccount() {
  account = null;
  listeners.forEach((l) => l());
}
