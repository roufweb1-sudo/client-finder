import { encryptToken, readState } from "@/lib/crypto";
import { addressFromIdToken, exchangeCode } from "@/lib/gmail";
import { adminDb } from "@/lib/server";

function back(message: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aiclientfinderapp.com";
  return Response.redirect(`${base.replace(/\/$/, "")}/settings?email=${encodeURIComponent(message)}`, 303);
}

/** Where Google sends the user back after they allow (or refuse) sending. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return back("cancelled");

  const userId = readState(url.searchParams.get("state") || "");
  if (!userId) return back("expired");

  const code = url.searchParams.get("code");
  if (!code) return back("failed");

  try {
    const token = await exchangeCode(code);
    if (!token.refresh_token) return back("norefresh");
    const address = addressFromIdToken(token.id_token);
    const { error } = await adminDb().from("email_accounts").upsert(
      {
        user_id: userId,
        provider: "gmail",
        address,
        refresh_token: encryptToken(token.refresh_token),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return back("failed");
    return back("connected");
  } catch {
    return back("failed");
  }
}
