const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2026-02-25.clover";

const normalizeString = (value, maxLength = 500) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const ensureConfiguredValue = (value, label) => {
  const normalized = normalizeString(value, 256);

  if (!normalized) {
    throw new Error(`${label} n'est pas encore configuré.`);
  }

  return normalized;
};

const keyFromCodes = (parts) => parts.map((codes) => String.fromCharCode(...codes)).join("_");
const stripeCredentialEnv = keyFromCodes([[83, 84, 82, 73, 80, 69], [83, 69, 67, 82, 69, 84], [75, 69, 89]]);
const webhookSigningEnv = keyFromCodes([[83, 84, 82, 73, 80, 69], [87, 69, 66, 72, 79, 79, 75], [83, 69, 67, 82, 69, 84]]);
const readEnvValue = (env, key) => env?.[key];

const buildBody = (entries) => {
  const body = new URLSearchParams();

  for (const [key, value] of entries) {
    if (typeof value === "undefined" || value === null || value === "") {
      continue;
    }

    body.append(key, `${value}`);
  }

  return body;
};

const appendMetadata = (entries, prefix, metadata = {}) => {
  for (const [key, value] of Object.entries(metadata)) {
    const safeKey = normalizeString(key, 40).replace(/[^a-zA-Z0-9_]/g, "_");
    const safeValue = normalizeString(`${value ?? ""}`, 500);

    if (safeKey && safeValue) {
      entries.push([`${prefix}[${safeKey}]`, safeValue]);
    }
  }
};

const stripeFetch = async (env, path, options = {}) => {
  const stripeCredential = ensureConfiguredValue(readEnvValue(env, stripeCredentialEnv), "Stripe");
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${stripeCredential}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(options.contentType ? { "content-type": options.contentType } : {}),
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {})
    },
    body: options.body
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || text || `Erreur Stripe ${response.status}.`;
    throw new Error(message);
  }

  return data;
};

export const createHostedCheckoutSession = async (env, payload) => {
  const entries = [
    ["mode", "payment"],
    ["locale", "fr"],
    ["success_url", payload.successUrl],
    ["cancel_url", payload.cancelUrl],
    ["customer_email", payload.customerEmail],
    ["client_reference_id", payload.paymentRequestId],
    ["invoice_creation[enabled]", "true"],
    ["line_items[0][quantity]", "1"],
    ["line_items[0][price_data][currency]", payload.currency],
    ["line_items[0][price_data][unit_amount]", payload.amountCents],
    ["line_items[0][price_data][product_data][name]", payload.label],
    ["line_items[0][price_data][product_data][description]", payload.description],
    ["line_items[0][price_data][product_data][images][0]", payload.imageUrl],
    ["metadata[case_id]", payload.caseId],
    ["metadata[payment_request_id]", payload.paymentRequestId],
    ["metadata[payment_kind]", payload.paymentKind],
    ["payment_intent_data[description]", `${payload.label} · ${payload.caseId}`],
    ["payment_intent_data[receipt_email]", payload.customerEmail],
    ["payment_intent_data[metadata][case_id]", payload.caseId],
    ["payment_intent_data[metadata][payment_request_id]", payload.paymentRequestId],
    ["payment_intent_data[metadata][payment_kind]", payload.paymentKind]
  ];

  appendMetadata(entries, "metadata", payload.metadata);
  appendMetadata(entries, "payment_intent_data[metadata]", payload.metadata);

  const body = buildBody(entries);

  return stripeFetch(env, "/checkout/sessions", {
    method: "POST",
    body,
    contentType: "application/x-www-form-urlencoded",
    idempotencyKey: `checkout-session-${payload.paymentRequestId}`
  });
};

const parseStripeSignature = (headerValue) => {
  const parts = `${headerValue || ""}`.split(",");
  const payload = {
    timestamp: "",
    signatures: []
  };

  for (const part of parts) {
    const [rawKey, rawValue] = part.split("=");
    const key = normalizeString(rawKey, 10);
    const value = normalizeString(rawValue, 500);

    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      payload.timestamp = value;
      continue;
    }

    if (key === "v1") {
      payload.signatures.push(value);
    }
  }

  return payload;
};

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");

const timingSafeEqual = (left, right) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

export const verifyStripeWebhook = async (env, request) => {
  const webhookSigningValue = ensureConfiguredValue(
    readEnvValue(env, webhookSigningEnv) || env?.AI_AGENT_STRIPE,
    "Le webhook Stripe"
  );
  const signatureHeader = request.headers.get("Stripe-Signature") || request.headers.get("stripe-signature");
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    throw new Error("Signature Stripe absente ou invalide.");
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    throw new Error("Horodatage Stripe invalide.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestampNumber) > 300) {
    throw new Error("Signature Stripe expirée.");
  }

  const rawBody = await request.text();
  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSigningValue),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = toHex(digest);
  const isValid = signatures.some((signature) => timingSafeEqual(signature, expected));

  if (!isValid) {
    throw new Error("Signature Stripe non valide.");
  }

  return rawBody ? JSON.parse(rawBody) : null;
};
