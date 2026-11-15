import { adminDb } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";

export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });
  const { error } = await adminDb().from("email_accounts").delete().eq("user_id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
