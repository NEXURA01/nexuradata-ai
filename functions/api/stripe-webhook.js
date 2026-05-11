import { syncPaymentRequestFromStripe } from "../_lib/cases.js";
import { json, methodNotAllowed, onOptions } from "../_lib/http.js";
import { verifyStripeWebhook } from "../_lib/stripe.js";

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  if (!context.env?.DATABASE_URL) {
    return json({ ok: false, message: "Service temporairement indisponible." }, { status: 503 });
  }

  let event;

  try {
    event = await verifyStripeWebhook(context.env, context.request);
  } catch {
    return json(
      { ok: false, message: "Signature invalide." },
      { status: 400 }
    );
  }

  // Validate event type
  const allowedEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired"
  ];
  if (!allowedEvents.includes(event.type)) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "stripe_webhook_unknown_event",
      eventId: event.id,
      eventType: event.type,
      message: "Unknown event type received"
    }));
    return json({ ok: true }); // Return 200 to acknowledge; Stripe will retry other event types
  }

  try {
    const payment = await syncPaymentRequestFromStripe(context.env, event);

    if (!payment) {
      const sessionId = event.data?.object?.id;
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        context: "stripe_webhook_payment_not_found",
        eventId: event.id,
        eventType: event.type,
        sessionId,
        message: "Payment request not found for Stripe session"
      }));
    }

    return json({
      ok: true,
      received: true,
      paymentRequestId: payment?.paymentRequestId || null
    });
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "stripe_webhook_processing_error",
      eventId: event.id,
      eventType: event.type,
      error: err.message,
      stack: err.stack
    }));

    return json(
      { ok: false, message: "Erreur interne." },
      { status: 500 }
    );
  }
};

export const onRequest = methodNotAllowed;
