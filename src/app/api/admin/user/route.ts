import { adminDb, adminFromRequest, grantPro, revokePro } from "@/lib/server";

type Body = { userId?: string; action?: "grant" | "revoke"; days?: number };

// Admin actions on one user: give Pro for some days, or remove Pro
export async function POST(request: Request) {
  const admin = await adminFromRequest(request);
  if (!admin) return Response.json({ error: "Admins only." }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const userId = body.userId;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return Response.json({ error: "Unknown user." }, { status: 400 });

  try {
    const { data, error } = await adminDb().auth.admin.getUserById(userId);
    if (error || !data.user) return Response.json({ error: "Unknown user." }, { status: 404 });

    if (body.action === "grant") {
      const days = Math.floor(Number(body.days));
      if (!Number.isFinite(days) || days < 1 || days > 730) return Response.json({ error: "Days must be between 1 and 730." }, { status: 400 });
      const expires = await grantPro(userId, days >= 365 ? "yearly" : "monthly", days);
      return Response.json({ ok: true, expiresAt: expires.toISOString() });
    }
    if (body.action === "revoke") {
      await revokePro(userId);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
