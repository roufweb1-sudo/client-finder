import { signState } from "@/lib/crypto";
import { authUrl } from "@/lib/gmail";
import { userFromRequest } from "@/lib/supabase";

/** Hands back the Google consent URL. The browser does the redirecting, so the user's session stays in the browser. */
export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return Response.json({ error: "Gmail sending is not configured on the server yet." }, { status: 500 });
  }
  return Response.json({ url: authUrl(signState(userId)) });
}
