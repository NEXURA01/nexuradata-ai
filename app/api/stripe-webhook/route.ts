import Stripe from "stripe";
import { sendTeamPaymentCompletedEmail } from "@/lib/server-email";

export const runtime = "nodejs";

const PAID_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

const ALLOWED_EVENTS = new Set([
  ...PAID_EVENTS,
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  let teamDelivery: { sent: boolean; reason?: string } = {
    sent: false,
    reason: "not-attempted",
  };

  if (PAID_EVENTS.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session;
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
    delivery: {
      team: teamDelivery.sent ? "sent" : teamDelivery.reason,
    },
  });
}