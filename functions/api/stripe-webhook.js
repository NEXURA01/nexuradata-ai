import { syncPaymentRequestFromStripe } from "../_lib/cases.js";
import { getDb } from "../_lib/db.js";
import { json, methodNotAllowed, onOptions } from "../_lib/http.js";
import { hasSupabaseServiceKey, supabaseUpdateByStripeSession } from "../_lib/supabase.js";
import { verifyStripeWebhook } from "../_lib/stripe.js";

const hasLegacyDatabaseUrl = (env) => /^postgres(ql)?:\/\//i.test(`${env?.DATABASE_URL || ""}`.trim());

const mapSessionStatus = (eventType) => {
  if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
    return "paid";
  }

  if (eventType === "checkout.session.expired") {
    return "expired";
  }

  if (eventType === "checkout.session.async_payment_failed") {
    return "failed";
  }

  return "open";
};

const syncStripePaymentLedger = async (env, event) => {
  const session = event?.data?.object;

  if (!session || session.object !== "checkout.session" || !session.id) {
    return null;
  }

  const sql = getDb(env);
  const status = mapSessionStatus(event.type);
  const customerEmail = `${session.customer_details?.email || session.customer_email || ""}`.trim().toLowerCase();
  const amount = Number(session.amount_total || 0);

  const rows = await sql`UPDATE stripe_payments
    SET
      customer_email = COALESCE(NULLIF(${customerEmail}, ''), customer_email),
      amount = CASE WHEN ${amount} > 0 THEN ${amount} ELSE amount END,
      status = ${status}
    WHERE stripe_session_id = ${session.id}
    RETURNING id, stripe_session_id, status`;

  return rows?.[0] || null;
};

const syncOperationalPayment = async (env, event) => {
  const session = event?.data?.object;

  if (!session || session.object !== "checkout.session" || !session.id) {
    return null;
  }

  if (!env?.SUPABASE_URL || !hasSupabaseServiceKey(env)) {
    return null;
  }

  const rows = await supabaseUpdateByStripeSession(env, "payments", session.id, {
    amount: Number(session.amount_total || 0) || undefined,
    status: mapSessionStatus(event.type)
  });

  return rows?.[0] || null;
};

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  if (!hasLegacyDatabaseUrl(context.env) && (!context.env?.SUPABASE_URL || !hasSupabaseServiceKey(context.env))) {
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
    const payment = hasLegacyDatabaseUrl(context.env)
      ? await syncPaymentRequestFromStripe(context.env, event)
      : null;
    let ledgerPayment = null;
    let operationalPayment = null;

    if (hasLegacyDatabaseUrl(context.env)) {
      try {
        ledgerPayment = await syncStripePaymentLedger(context.env, event);
      } catch {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          context: "stripe_webhook_ledger_sync_error",
          eventId: event.id,
          eventType: event.type
        }));
      }
    }

    try {
      operationalPayment = await syncOperationalPayment(context.env, event);
    } catch {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        context: "stripe_webhook_operational_payment_sync_error",
        eventId: event.id,
        eventType: event.type
      }));
    }

    if (!payment && !ledgerPayment && !operationalPayment) {
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
      paymentRequestId: payment?.paymentRequestId || null,
      stripePaymentId: ledgerPayment?.id || operationalPayment?.id || null
    });
  } catch {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "stripe_webhook_processing_error",
      eventId: event.id,
      eventType: event.type
    }));

    return json(
      { ok: false, message: "Erreur interne." },
      { status: 500 }
    );
  }
};

export const onRequest = methodNotAllowed;
