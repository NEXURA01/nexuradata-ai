import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendTeamPaymentCompletedEmail } from "@/lib/server-email";

export const runtime = "nodejs";

const PAID_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

const FAILED_EVENTS = new Set([
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

const ALLOWED_EVENTS = new Set([
  ...PAID_EVENTS,
  ...FAILED_EVENTS,
]);

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.AI_AGENT_STRIPE;

  if (!stripeSecretKey || !webhookSecret) {
    return Response.json(
      { ok: false, message: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { ok: false, message: "Stripe signature is missing" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    return Response.json(
      { ok: false, message: "Invalid Stripe signature" },
      { status: 400 }
    );
  }

  if (!ALLOWED_EVENTS.has(event.type)) {
    return Response.json({ ok: true, received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  let paymentStatus = "received";

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const status = PAID_EVENTS.has(event.type) ? "paid" : "failed";
    paymentStatus = status;

    const { error } = await supabase.from("payment_sessions").upsert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email || session.customer_email || session.metadata?.customerEmail || null,
      product_id: session.metadata?.productId || null,
      locale: session.metadata?.locale || "fr",
      amount_total: session.amount_total,
      currency: session.currency || "cad",
      status,
      paid_at: PAID_EVENTS.has(event.type) ? new Date().toISOString() : null,
      event_id: event.id,
      metadata: {
        eventType: event.type,
        paymentStatus: session.payment_status,
      },
    }, { onConflict: "stripe_session_id" });

    if (error) {
      console.error("Payment webhook storage error:", error);
      return Response.json({ ok: false, message: "Payment storage failed" }, { status: 503 });
    }
  }

  let teamDelivery: { sent: boolean; reason?: string } = {
    sent: false,
    reason: "not-attempted",
  };

  if (PAID_EVENTS.has(event.type)) {
    teamDelivery = await sendTeamPaymentCompletedEmail(
      {
        eventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        customerEmail: session.customer_details?.email || session.customer_email || null,
        amountTotal: session.amount_total,
        currency: session.currency,
        productId: session.metadata?.productId || null,
        locale: session.metadata?.locale || null,
      },
      req
    );
  }

  return Response.json({
    ok: true,
    received: true,
    paymentStatus,
    delivery: {
      team: teamDelivery.sent ? "sent" : teamDelivery.reason,
    },
  });
}
