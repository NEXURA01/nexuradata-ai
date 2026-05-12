import { syncPaymentRequestFromStripe } from "../_lib/cases.js";
import { getDb } from "../_lib/db.js";
import { sendTeamPaymentCompletedEmail } from "../_lib/email.js";
import { json, methodNotAllowed, onOptions } from "../_lib/http.js";
import { hasSupabaseServiceKey, supabaseInsert, supabaseRequest, supabaseUpdateById, supabaseUpdateByStripeSession } from "../_lib/supabase.js";
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

const isPaidEvent = (eventType) =>
  eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded";

const firstRow = (rows) => Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

const selectById = async (env, table, id) => {
  if (!id) return null;
  const rows = await supabaseRequest(env, table, {
    query: `?id=eq.${encodeURIComponent(id)}&limit=1`
  });
  return firstRow(rows);
};

const upsertWorkflowEvent = (env, event) =>
  supabaseRequest(env, "workflow_events", {
    method: "POST",
    query: "?on_conflict=workflow_case_id,event_type",
    body: event,
    prefer: "resolution=ignore-duplicates,return=representation"
  });

const createWorkflowMilestones = async (env, workflowCase, payment) => {
  const base = {
    workflow_case_id: workflowCase.id,
    lead_id: workflowCase.lead_id || payment.lead_id || null,
    metadata: {
      payment_id: payment.id,
      payment_request_id: payment.payment_request_id,
      stripe_session_id: payment.stripe_session_id
    }
  };
  const milestones = [
    {
      event_type: "assessment_received",
      title: "Assessment received",
      description: "The assessment intake was saved in Supabase."
    },
    {
      event_type: "ai_estimate_completed",
      title: "AI estimate completed",
      description: "The AI estimate was generated and attached to the assessment."
    },
    {
      event_type: "payment_confirmed",
      title: "Payment confirmed",
      description: "The operational review payment was confirmed through Stripe."
    },
    {
      event_type: "human_review_pending",
      title: "Human review pending",
      description: "NEXURA can now validate the estimate and prepare the next workflow recommendation."
    }
  ];

  for (const milestone of milestones) {
    await upsertWorkflowEvent(env, { ...base, ...milestone });
  }
};

const syncWorkflowStatusFromPayment = async (env, event, payment) => {
  if (!payment?.id || !isPaidEvent(event.type)) {
    return null;
  }

  const lead = await selectById(env, "leads", payment.lead_id);
  const estimate = await selectById(env, "ai_estimates", payment.ai_estimate_id);
  let workflowCase = await selectById(env, "workflow_cases", payment.workflow_case_id);

  const metadata = typeof payment.metadata === "object" && payment.metadata ? payment.metadata : {};
  const workflowPayload = {
    current_stage: "human_review_pending",
    payment_status: "paid",
    workflow_status: "human_review_pending",
    dashboard_status: "not_started",
    metadata: {
      source: "stripe_checkout",
      payment_id: payment.id,
      payment_request_id: payment.payment_request_id,
      stripe_session_id: payment.stripe_session_id,
      milestones: [
        "Assessment received",
        "AI estimate completed",
        "Payment confirmed",
        "Human review pending"
      ]
    }
  };

  if (workflowCase?.id) {
    workflowCase = firstRow(await supabaseUpdateById(env, "workflow_cases", workflowCase.id, workflowPayload)) || workflowCase;
  } else {
    workflowCase = firstRow(await supabaseInsert(env, "workflow_cases", {
      lead_id: payment.lead_id || null,
      ai_estimate_id: payment.ai_estimate_id || null,
      organization: lead?.company || lead?.organization || "",
      contact_email: lead?.email || payment.customer_email || "",
      workflow_summary: lead?.problem || lead?.workflow_summary || "",
      recommended_solution: estimate?.recommended_scope || metadata.recommended_scope || "Operational review",
      task_count: 0,
      automation_count: 0,
      ...workflowPayload
    }));

    if (workflowCase?.id) {
      await supabaseUpdateById(env, "payments", payment.id, { workflow_case_id: workflowCase.id });
    }
  }

  if (workflowCase?.id) {
    await createWorkflowMilestones(env, workflowCase, payment);
  }

  return workflowCase;
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

  const customerEmail = `${session.customer_details?.email || session.customer_email || ""}`.trim().toLowerCase();

  const rows = await supabaseUpdateByStripeSession(env, "payments", session.id, {
    amount: Number(session.amount_total || 0) || undefined,
    customer_email: customerEmail || undefined,
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
    let workflowCase = null;

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
      workflowCase = await syncWorkflowStatusFromPayment(context.env, event, operationalPayment);

      if (operationalPayment?.id && isPaidEvent(event.type)) {
        const teamDelivery = await sendTeamPaymentCompletedEmail(
          context.env,
          {
            payment: operationalPayment,
            workflowCase,
            event
          },
          context.request.url
        );

        if (!teamDelivery.sent && teamDelivery.reason !== "not-configured" && teamDelivery.reason !== "missing-team-inbox") {
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            context: "team_payment_notification_not_sent",
            eventId: event.id,
            eventType: event.type,
            reason: teamDelivery.reason
          }));
        }
      }
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
      stripePaymentId: ledgerPayment?.id || operationalPayment?.id || null,
      workflowCaseId: workflowCase?.id || null
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
