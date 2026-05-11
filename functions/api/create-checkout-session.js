import { getDb } from "../_lib/db.js";
import { getPublicOrigin, normalizeText } from "../_lib/cases.js";
import { json, methodNotAllowed, onOptions, parsePayload } from "../_lib/http.js";
import { createHostedCheckoutSession } from "../_lib/stripe.js";

const ASSESSMENT_AMOUNT_CENTS = 75000;
const ASSESSMENT_CURRENCY = "cad";

const generateActivationId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `ACT-${date}-${token}`;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  if (!context.env?.DATABASE_URL || !context.env?.STRIPE_SECRET_KEY) {
    return json({ ok: false, message: "Activation temporairement indisponible." }, { status: 503 });
  }

  let payload = {};

  try {
    payload = await parsePayload(context.request);
  } catch {
    payload = {};
  }

  const customerEmail = normalizeText(payload.email || payload.courriel, 160).toLowerCase();

  if (customerEmail && !isValidEmail(customerEmail)) {
    return json({ ok: false, message: "Adresse courriel invalide." }, { status: 400 });
  }

  const activationId = generateActivationId();
  const origin = getPublicOrigin(context.env, context.request.url);
  const successUrl = `${origin}/paiement-reussi.html?activationId=${encodeURIComponent(activationId)}`;
  const cancelUrl = `${origin}/paiement-annule.html?activationId=${encodeURIComponent(activationId)}`;

  try {
    const sql = getDb(context.env);

    const session = await createHostedCheckoutSession(context.env, {
      successUrl,
      cancelUrl,
      customerEmail,
      paymentRequestId: activationId,
      caseId: activationId,
      paymentKind: "operational_assessment",
      label: "Operational Assessment",
      description: "Infrastructure analysis, operational recommendation and workflow initialization.",
      amountCents: ASSESSMENT_AMOUNT_CENTS,
      currency: ASSESSMENT_CURRENCY,
      imageUrl: `${origin}/assets/stripe-operational-activation.png`
    });

    await sql`INSERT INTO stripe_payments (
      stripe_session_id, customer_email, amount, status
    ) VALUES (
      ${normalizeText(session.id, 120)}, ${customerEmail}, ${ASSESSMENT_AMOUNT_CENTS}, 'open'
    )`;

    return json({
      ok: true,
      url: session.url,
      activationId,
      stripeSessionId: session.id
    });
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "operational_checkout_create_error",
      error: err.message
    }));

    return json({ ok: false, message: "L'activation sécurisée n'a pas pu être initialisée." }, { status: 500 });
  }
};

export const onRequest = methodNotAllowed;