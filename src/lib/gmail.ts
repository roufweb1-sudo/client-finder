import "server-only";
import { decryptToken } from "@/lib/crypto";
import { adminDb } from "@/lib/server";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type EmailAccount = { provider: "gmail"; address: string; refresh_token: string };

export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aiclientfinderapp.com";
  return `${base.replace(/\/$/, "")}/api/email/callback`;
}

export function authUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: `${GMAIL_SCOPE} https://www.googleapis.com/auth/userinfo.email`,
    access_type: "offline",
    // Without this Google skips the refresh token on a repeat connect.
    prompt: "consent",
    include_granted_scopes: "false",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      ...body,
    }).toString(),
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error_description || json?.error || "Google rejected the request");
  return json as { access_token: string; refresh_token?: string; id_token?: string; expires_in: number };
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() });
}

export function accessTokenFrom(refreshToken: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
}

/** The address Google just authorised, read out of the id_token it returned. */
export function addressFromIdToken(idToken: string | undefined): string {
  if (!idToken) return "";
  try {
    const body = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    return typeof body.email === "string" ? body.email : "";
  } catch {
    return "";
  }
}

export async function loadAccount(userId: string): Promise<EmailAccount | null> {
  const { data, error } = await adminDb().from("email_accounts").select("provider,address,refresh_token").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return { provider: data.provider, address: data.address, refresh_token: decryptToken(data.refresh_token) };
}

function encodeHeader(v: string): string {
  // Non-ASCII subjects (Malayalam) have to be MIME-encoded or Gmail mangles them.
  return /^[\x20-\x7E]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=`;
}

export function buildMessage(opts: { from: string; fromName: string; to: string; subject: string; body: string; replyTo?: string }): string {
  const headers = [
    `From: ${opts.fromName ? `${encodeHeader(opts.fromName)} <${opts.from}>` : opts.from}`,
    `To: ${opts.to}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : "",
    `Subject: ${encodeHeader(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);
  return `${headers.join("\r\n")}\r\n\r\n${Buffer.from(opts.body, "utf8").toString("base64")}`;
}

export async function sendViaGmail(accessToken: string, raw: string): Promise<void> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(raw, "utf8").toString("base64url") }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message || `Gmail refused the message (${res.status})`);
  }
}
