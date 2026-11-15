import { accessTokenFrom, buildMessage, loadAccount, sendViaGmail } from "@/lib/gmail";
import { userFromRequest } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { to?: string; subject?: string; message?: string; profile?: Partial<Profile> };
  const to = (body.to || "").trim();
  const subject = (body.subject || "").trim();
  const text = (body.message || "").trim();

  if (!EMAIL_RE.test(to)) return Response.json({ error: "That email address doesn't look right." }, { status: 400 });
  if (!subject) return Response.json({ error: "Add a subject line before sending." }, { status: 400 });
  if (!text) return Response.json({ error: "There is no message to send." }, { status: 400 });

  const account = await loadAccount(userId);
  if (!account) return Response.json({ error: "No mailbox is connected. Connect one under Settings → Email.", connect: true }, { status: 409 });

  try {
    const token = await accessTokenFrom(account.refresh_token);
    const raw = buildMessage({
      from: account.address,
      fromName: (body.profile?.name || "").slice(0, 60),
      to,
      subject,
      body: text,
      replyTo: (body.profile?.email || "").trim() || undefined,
    });
    await sendViaGmail(token.access_token, raw);
    return Response.json({ sent: true, from: account.address });
  } catch (e) {
    const msg = (e as Error).message;
    // Google revokes the token if the user removes our access, or after a long idle period.
    const expired = /invalid_grant|unauthorized|invalid credentials/i.test(msg);
    return Response.json(
      { error: expired ? "Gmail has disconnected. Reconnect it under Settings → Email." : `Couldn't send: ${msg}`, connect: expired },
      { status: expired ? 409 : 502 },
    );
  }
}
