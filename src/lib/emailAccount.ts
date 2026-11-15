"use client";

import { useSyncExternalStore } from "react";
import { authFetch } from "./storage";

export type EmailStatus = { connected: boolean; provider: string | null; address: string | null; connectedAt: string | null };

let status: EmailStatus | null = null;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

let inflight: Promise<void> | null = null;
export function refreshEmailStatus(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await authFetch("/api/email/status", {});
      if (res.ok) {
        status = (await res.json()) as EmailStatus;
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

export function useEmailStatus(): EmailStatus | null {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => null,
  );
}

export function clearEmailStatus() {
  status = null;
  listeners.forEach((l) => l());
}
