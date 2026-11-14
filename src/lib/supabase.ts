import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient | null = null;

/** Supabase client for the browser (one shared instance). Safe to use with the publishable key because every table has Row Level Security. */
export function supabase(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local");
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

/** Server side: check the logged-in user's access token sent by the browser. Returns the user id, or null. */
export async function userFromRequest(request: Request): Promise<string | null> {
  if (!url || !key) return null;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const server = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await server.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
