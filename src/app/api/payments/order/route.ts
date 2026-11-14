import { PRICES, type Period } from "@/lib/plans";
import { adminDb } from "@/lib/server";
import { userFromRequest } from "@/lib/supabase";

// Step 1 of a payment: create a Razorpay order for the chosen plan
export async function POST(request: Request) {
  const userId = await userFromRequest(request);
  if (!userId) return Response.json({ error: "Please log in again." }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return Response.json({ error: "Payments aren't set up yet (Razorpay keys missing)." }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { period?: Period };
  const period: Period = body.period === "yearly" ? "yearly" : "monthly";
  const price = PRICES[period];

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: price.amountPaise,
      currency: "INR",
      receipt: `cf_${Date.now()}`,
      notes: { user_id: userId, period, product: "Client Finder Pro" },
    }),
  });
  const order = await res.json();
  if (!res.ok) return Response.json({ error: order?.error?.description || "Could not start the payment." }, { status: 502 });

  const { error } = await adminDb()
    .from("payments")
    .insert({ user_id: userId, razorpay_order_id: order.id, plan_period: period, amount: price.amountPaise });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ orderId: order.id, amount: price.amountPaise, currency: "INR", keyId, period });
}
