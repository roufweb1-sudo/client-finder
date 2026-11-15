import { adminDb } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";

/** What the Settings page shows: which mailbox is connected, if any. Never returns the token. */
export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });
  const { data } = await adminDb().from("email_accounts").select("provider,address,connected_at").eq("user_id", userId).maybeSingle();
  return Response.json({ connected: !!data, provider: data?.provider ?? null, address: data?.address ?? null, connectedAt: data?.connected_at ?? null });
}
