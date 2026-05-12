import { getPublicOrigin, normalizeText } from "../_lib/cases.js";
import { json, methodNotAllowed, onOptions, parsePayload } from "../_lib/http.js";
import { hasSupabaseServiceKey, supabaseInsert } from "../_lib/supabase.js";
import { createHostedCheckoutSession } from "../_lib/stripe.js";

const DEFAULT_ACTIVATION_AMOUNT_CENTS = 75000;
const MIN_ASSESSMENT_AMOUNT_CENTS = 25000;
const MAX_ASSESSMENT_AMOUNT_CENTS = 150000;

const generatePaymentId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `PAY-${date}-${token}`;
};

const normalizeAmount = (value) => {
  const amount = Math.round(Number(value || DEFAULT_ACTIVATION_AMOUNT_CENTS));

  if (!Number.isFinite(amount) || amount < MIN_ASSESSMENT_AMOUNT_CENTS || amount > MAX_ASSESSMENT_AMOUNT_CENTS) {
    throw new Error("Montant invalide.");
  }

  return amount;
};

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  if (!context.env?.SUPABASE_URL || !hasSupabaseServiceKey(context.env) || !context.env?.STRIPE_SECRET_KEY) {
    return json({ ok: false, message: "Activation de paiement temporairement indisponible." }, { status: 503 });
  }

  try {
    const payload = await parsePayload(context.request);
    const amountCents = normalizeAmount(payload.amount);
    const leadId = normalizeText(payload.lead_id || payload.leadId, 80);
    const customerEmail = normalizeText(payload.email, 180).toLowerCase();
    const paymentRequestId = generatePaymentId();
    const origin = getPublicOrigin(context.env, context.request.url);
    const successUrl = `${origin}/paiement-reussi.html?paymentRequestId=${encodeURIComponent(paymentRequestId)}`;
    const cancelUrl = `${origin}/paiement-annule.html?paymentRequestId=${encodeURIComponent(paymentRequestId)}`;

    const session = await createHostedCheckoutSession(context.env, {
      successUrl,
      cancelUrl,
      customerEmail,
      paymentRequestId,
      caseId: leadId || paymentRequestId,
      paymentKind: "operational_activation",
      label: "Operational Infrastructure Assessment",
      description: "Assessment payment before human validation, final proposal and any implementation invoice.",
      amountCents,
      currency: "cad",
      imageUrl: `${origin}/assets/stripe-operational-activation.png`
    });

    const paymentInsert = await supabaseInsert(context.env, "payments", {
      lead_id: leadId || null,
      stripe_session_id: normalizeText(session.id, 160),
      amount: amountCents,
      status: "pending"
    });

    return json({
      ok: true,
      url: session.url,
      payment: paymentInsert?.[0] || null,
      paymentRequestId
    });
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "create_checkout_error",
      error: err.message
    }));

    const status = /montant|invalide/i.test(err.message) ? 400 : 500;
    return json({ ok: false, message: err.message || "Le paiement n'a pas pu être initialisé." }, { status });
  }
};

export const onRequest = methodNotAllowed;
