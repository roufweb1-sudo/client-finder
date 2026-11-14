import { createHmac, timingSafeEqual } from "node:crypto";
import { PRICES, type Period } from "@/lib/plans";
import { adminDb, grantPro } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";

// Step 2: Razorpay says the payment succeeded. Check its signature, then switch the user to Pro.
export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ error: "Payments aren't set up yet." }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  const orderId = body.razorpay_order_id || "";
  const paymentId = body.razorpay_payment_id || "";
  const signature = body.razorpay_signature || "";
  if (!orderId || !paymentId || !signature) return Response.json({ error: "Missing payment details." }, { status: 400 });

  // The signature proves the payment really came from Razorpay for this order
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const ok = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) return Response.json({ error: "Payment verification failed." }, { status: 400 });

  const db = adminDb();
  const { data: payment, error } = await db
    .from("payments")
    .select("user_id,status,plan_period")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (error || !payment) return Response.json({ error: "Order not found." }, { status: 404 });
  if (payment.user_id !== userId) return Response.json({ error: "This payment belongs to another account." }, { status: 403 });

  if (payment.status !== "paid") {
    // Mark paid first (only once), then grant Pro
    const { data: updated } = await db
      .from("payments")
      .update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq("razorpay_order_id", orderId)
      .neq("status", "paid")
      .select("id");
    if (updated && updated.length) {
      const period = payment.plan_period as Period;
      await grantPro(userId, period, PRICES[period].days);
    }
  }
  return Response.json({ ok: true });
}
