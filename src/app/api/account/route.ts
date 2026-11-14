import { adminFromRequest, getAccount } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";

// The logged-in user's plan, expiry and this month's usage
export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });
  try {
    const [account, admin] = await Promise.all([getAccount(userId), adminFromRequest(request)]);
    return Response.json({ ...account, isAdmin: !!admin });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
