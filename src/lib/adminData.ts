"use client";

import { useSyncExternalStore } from "react";
import type { AdminOverview } from "./admin";
import { authFetch } from "./storage";

// The admin dashboard data, kept outside React so pages can refresh it without cascading renders.
type AdminState = { data: AdminOverview | null; error: string | null; denied: boolean; loading: boolean };

let state: AdminState = { data: null, error: null, denied: false, loading: true };
const listeners = new Set<() => void>();

function set(patch: Partial<AdminState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const SERVER_STATE = state;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

let inflight: Promise<void> | null = null;

export function refreshAdmin(): Promise<void> {
  if (inflight) return inflight;
  set({ loading: true });
  inflight = (async () => {
    try {
      const res = await authFetch("/api/admin/overview", {});
      if (res.status === 401 || res.status === 403) {
        set({ denied: true, error: null });
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Could not load the dashboard.");
      set({ data: json as AdminOverview, error: null, denied: false });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      inflight = null;
      set({ loading: false });
    }
  })();
  return inflight;
}

export function setAdminError(error: string | null) {
  set({ error });
}

export function useAdmin(): AdminState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}
