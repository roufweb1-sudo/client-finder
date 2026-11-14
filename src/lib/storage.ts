"use client";

import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import type { Business, Lead, LeadStatus, Profile, SiteCheck } from "./types";

/*
 * Version 2: leads and branding are saved in Supabase, per logged-in user.
 * This module keeps a copy in memory so pages update instantly, and syncs changes to the database.
 */

type Row = {
  place_id: string;
  business: Business;
  site_check: SiteCheck | null;
  status: LeadStatus;
  follow_up: string | null;
  notes: string;
  search_query: string;
  created_at: string;
};

export const EMPTY_PROFILE: Profile = { name: "", brand: "", phone: "", email: "", logo: "" };
const EMPTY_LEADS: Lead[] = [];

type State = {
  ready: boolean; // auth checked
  session: Session | null;
  leads: Lead[];
  leadsLoaded: boolean;
  profile: Profile;
  error: string | null;
};

let state: State = { ready: false, session: null, leads: EMPTY_LEADS, leadsLoaded: false, profile: EMPTY_PROFILE, error: null };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const SERVER_STATE = state;
function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => pick(state), () => pick(SERVER_STATE));
}

function rowToLead(r: Row): Lead {
  return {
    ...r.business,
    id: r.place_id,
    siteCheck: r.site_check,
    status: r.status,
    followUp: r.follow_up,
    notes: r.notes,
    savedAt: r.created_at,
    searchQuery: r.search_query,
  };
}

function businessOf(l: Lead | Business): Business {
  return {
    id: l.id,
    name: l.name,
    address: l.address,
    phone: l.phone,
    intlPhone: l.intlPhone,
    website: l.website,
    websiteStatus: l.websiteStatus,
    rating: l.rating,
    reviews: l.reviews,
    mapsUrl: l.mapsUrl,
  };
}

function report(e: { message: string } | null) {
  if (e) set({ error: e.message });
}

// ---------- auth ----------

let started = false;
export function startAuth() {
  if (started || typeof window === "undefined") return;
  started = true;
  const sb = supabase();
  sb.auth.getSession().then(({ data }) => {
    set({ session: data.session, ready: true });
    if (data.session) loadData();
  });
  sb.auth.onAuthStateChange((event, session) => {
    const userChanged = session?.user.id !== state.session?.user.id;
    set({ session, ready: true });
    if (!session) set({ leads: EMPTY_LEADS, leadsLoaded: false, profile: EMPTY_PROFILE });
    else if (userChanged || event === "SIGNED_IN") loadData();
  });
}

export function useAuth() {
  const session = useStore((s) => s.session);
  const ready = useStore((s) => s.ready);
  return { session, ready, email: session?.user.email ?? null };
}

export async function signOut() {
  await supabase().auth.signOut();
}

/** fetch() for our own API routes, with the user's login token attached. */
export async function authFetch(url: string, body: unknown): Promise<Response> {
  const { data } = await supabase().auth.getSession();
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
}

// ---------- loading ----------

let loading = false;
async function loadData() {
  if (loading) return;
  loading = true;
  const sb = supabase();
  const [leadsRes, profileRes] = await Promise.all([
    sb.from("leads").select("place_id,business,site_check,status,follow_up,notes,search_query,created_at").order("created_at", { ascending: false }),
    sb.from("profiles").select("name,brand,phone,email,logo").maybeSingle(),
  ]);
  report(leadsRes.error);
  report(profileRes.error);
  const leads = ((leadsRes.data as Row[] | null) ?? []).map(rowToLead);
  const profile = profileRes.data ? { ...EMPTY_PROFILE, ...(profileRes.data as Profile) } : EMPTY_PROFILE;
  set({ leads, profile, leadsLoaded: true });
  loading = false;
  await importFromVersion1(leads.length === 0, !profileRes.data);
}

// Move leads/branding saved in the browser by version 1 into the account (once)
async function importFromVersion1(noLeads: boolean, noProfile: boolean) {
  try {
    if (window.localStorage.getItem("cf_imported_v1")) return;
    const oldLeads = JSON.parse(window.localStorage.getItem("cf_leads_v1") || "[]") as Lead[];
    const oldProfile = JSON.parse(window.localStorage.getItem("cf_profile_v1") || "null") as Profile | null;
    if (noLeads && oldLeads.length) {
      const rows = oldLeads.map((l) => ({
        user_id: state.session?.user.id,
        place_id: l.id,
        business: businessOf(l),
        site_check: l.siteCheck ?? null,
        status: l.status,
        follow_up: l.followUp,
        notes: l.notes || "",
        search_query: l.searchQuery || "",
        created_at: l.savedAt,
      }));
      const { error } = await supabase().from("leads").upsert(rows, { onConflict: "user_id,place_id" });
      if (!error) set({ leads: oldLeads });
    }
    if (noProfile && oldProfile) saveProfile({ ...EMPTY_PROFILE, ...oldProfile });
    window.localStorage.setItem("cf_imported_v1", "1");
  } catch {
    /* nothing to import */
  }
}

// ---------- leads ----------

export function useLeads(): Lead[] {
  return useStore((s) => s.leads);
}

export function useLeadsLoaded(): boolean {
  return useStore((s) => s.leadsLoaded);
}

export function useStorageError(): string | null {
  return useStore((s) => s.error);
}

export function addLead(b: Business, searchQuery: string, siteCheck?: SiteCheck | null): void {
  if (state.leads.some((l) => l.id === b.id)) return;
  const lead: Lead = {
    ...businessOf(b),
    status: "New",
    followUp: null,
    notes: "",
    savedAt: new Date().toISOString(),
    searchQuery,
    siteCheck: siteCheck ?? null,
  };
  set({ leads: [lead, ...state.leads] });
  supabase()
    .from("leads")
    .upsert(
      { user_id: state.session?.user.id, place_id: b.id, business: businessOf(b), site_check: siteCheck ?? null, status: "New", search_query: searchQuery },
      { onConflict: "user_id,place_id" },
    )
    .then(({ error }) => report(error));
}

export function updateLead(id: string, patch: Partial<Lead>) {
  set({ leads: state.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const row: Record<string, unknown> = {};
  if ("status" in patch) row.status = patch.status;
  if ("followUp" in patch) row.follow_up = patch.followUp || null;
  if ("notes" in patch) row.notes = patch.notes ?? "";
  if ("siteCheck" in patch) row.site_check = patch.siteCheck ?? null;
  if (Object.keys(row).length === 0) return;
  supabase().from("leads").update(row).eq("place_id", id).then(({ error }) => report(error));
}

export function removeLead(id: string) {
  set({ leads: state.leads.filter((l) => l.id !== id) });
  supabase().from("leads").delete().eq("place_id", id).then(({ error }) => report(error));
}

// ---------- branding profile ----------

export function useProfile(): Profile {
  return useStore((s) => s.profile);
}

export function useMyName(): string {
  return useStore((s) => s.profile.name);
}

let profileTimer: ReturnType<typeof setTimeout> | null = null;
export function saveProfile(p: Profile) {
  set({ profile: p });
  if (profileTimer) clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    supabase()
      .from("profiles")
      .upsert({ ...p, user_id: state.session?.user.id }, { onConflict: "user_id" })
      .then(({ error }) => report(error));
  }, 600);
}

/** Save branding right away (used by the Save button). Returns an error message, or null when saved. */
export async function saveProfileNow(p: Profile): Promise<string | null> {
  if (profileTimer) clearTimeout(profileTimer);
  const { error } = await supabase()
    .from("profiles")
    .upsert({ ...p, user_id: state.session?.user.id }, { onConflict: "user_id" });
  if (error) return error.message;
  set({ profile: p });
  return null;
}

export function setMyName(name: string) {
  saveProfile({ ...state.profile, name });
}
