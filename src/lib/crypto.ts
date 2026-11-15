import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * A Gmail refresh token lets us send mail as the user for as long as they allow
 * it, so it never sits in the database in the clear. AES-256-GCM, with the key
 * in EMAIL_TOKEN_KEY (64 hex characters) and the nonce stored beside the
 * ciphertext.
 */
function key(): Buffer {
  const hex = process.env.EMAIL_TOKEN_KEY || "";
  if (hex.length !== 64) throw new Error("EMAIL_TOKEN_KEY is missing or not 64 hex characters. Add it to .env.local and restart.");
  return Buffer.from(hex, "hex");
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv.toString("base64url"), c.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function decryptToken(packed: string): string {
  const [iv, tag, body] = packed.split(".");
  if (!iv || !tag || !body) throw new Error("Stored token is unreadable");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8");
}

/**
 * Google sends the user back to us with no session attached, so the OAuth state
 * has to carry who they are - signed, or anyone could connect a mailbox to
 * somebody else's account.
 */
export function signState(userId: string, minutes = 15): string {
  const payload = `${userId}.${Date.now() + minutes * 60_000}`;
  const mac = createHmac("sha256", key()).update(payload).digest("base64url");
  return Buffer.from(`${payload}.${mac}`).toString("base64url");
}

export function readState(state: string): string | null {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const at = raw.lastIndexOf(".");
    const payload = raw.slice(0, at);
    const given = Buffer.from(raw.slice(at + 1));
    const want = createHmac("sha256", key()).update(payload).digest("base64url");
    const wantBuf = Buffer.from(want);
    if (given.length !== wantBuf.length || !timingSafeEqual(given, wantBuf)) return null;
    const [userId, expiry] = payload.split(".");
    if (!userId || Number(expiry) < Date.now()) return null;
    return userId;
  } catch {
    return null;
  }
}
