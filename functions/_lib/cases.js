import { getDb } from "./db.js";
import { createHostedCheckoutSession } from "./stripe.js";
import { buildCaseAutomationDraft } from "./automation.js";
import {
  decryptAccessCode,
  encryptAccessCode,
  generateAccessCode,
  hashAccessCode,
  normalizeAccessCode
} from "./access-code.js";

export { decryptAccessCode, encryptAccessCode, generateAccessCode, hashAccessCode, normalizeAccessCode };

const allowedSupports = new Set([
  "Disque dur",
  "SSD",
  "RAID / NAS / serveur",
  "Téléphone / mobile",
  "Forensique / preuve numérique",
  "Mandat entreprise / juridique",
  "USB / carte mémoire",
  "Je ne sais pas"
]);

const allowedUrgencies = new Set([
  "Standard",
  "Rapide",
  "Urgent",
  "Très sensible"
]);

const allowedProfiles = new Set([
  "Particulier",
  "Entreprise / TI",
  "Cabinet juridique",
  "Assureur / partenaire",
  "Je ne sais pas"
]);

const allowedImpacts = new Set([
  "Planifié / non urgent",
  "Données importantes",
  "Opérations bloquées",
  "Client, juridique ou assurance impliqué"
]);

const allowedSensitivities = new Set([
  "Standard",
  "Confidentiel",
  "Données sensibles",
  "Preuve / chaîne de possession"
]);

const allowedStepStates = new Set(["pending", "active", "complete"]);
const allowedPaymentKinds = new Set(["deposit", "final", "custom"]);
const allowedQuoteStatuses = new Set(["none", "draft", "sent", "approved", "expired", "declined"]);
const allowedReminderTypes = new Set(["quote_follow_up", "payment_follow_up", "missing_information", "general_follow_up"]);
const allowedCaseFilterStatuses = new Set([
  "Dossier reçu",
  "Évaluation en cours",
  "Soumission envoyée",
  "En attente du client",
  "En cours",
  "En pause",
  "Terminé",
  "Fermé",
  "Intervention autorisée",
  "nouveau",
  "en-cours",
  "complete",
  "fermé"
]);

const localHostnames = new Set(["localhost", "127.0.0.1"]);

export const normalizeText = (value, maxLength) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
};

export const normalizeMultilineText = (value, maxLength) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").slice(0, maxLength);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const generateCaseId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `NX-${date}-${token}`;
};

export const normalizeCaseId = (value) => normalizeText(value, 40).toUpperCase().replace(/[^A-Z0-9-]/g, "");

export const validateSubmission = (payload) => {
  const nom = normalizeText(payload.nom, 120);
  const courriel = normalizeText(payload.courriel, 160).toLowerCase();
  const telephone = normalizeText(payload.telephone, 40);
  const support = normalizeText(payload.support, 60);
  const urgence = normalizeText(payload.urgence, 40);
  const profil = normalizeText(payload.profil, 60);
  const impact = normalizeText(payload.impact, 80);
  const sensibilite = normalizeText(payload.sensibilite, 80);
  const message = normalizeMultilineText(payload.message, 3000);
  const sourcePath = normalizeText(payload.sourcePath, 160) || "/";
  const honeypot = normalizeText(payload.website, 120);
  const consentement = payload.consentement === true || payload.consentement === "true" || payload.consentement === "on";

  if (honeypot) {
    throw new Error("Requête rejetée.");
  }

  if (!nom || !courriel || !support || !urgence || !message || !consentement) {
    throw new Error("Complétez tous les champs requis.");
  }

  if (!isValidEmail(courriel)) {
    throw new Error("Adresse courriel invalide.");
  }

  if (!allowedSupports.has(support)) {
    throw new Error("Support invalide.");
  }

  if (!allowedUrgencies.has(urgence)) {
    throw new Error("Niveau d'urgence invalide.");
  }

  if (profil && !allowedProfiles.has(profil)) {
    throw new Error("Profil du demandeur invalide.");
  }

  if (impact && !allowedImpacts.has(impact)) {
    throw new Error("Impact d'affaires invalide.");
  }

  if (sensibilite && !allowedSensitivities.has(sensibilite)) {
    throw new Error("Sensibilité du dossier invalide.");
  }

  const qualification = [
    profil ? `Profil du demandeur: ${profil}` : "",
    impact ? `Impact d'affaires: ${impact}` : "",
    sensibilite ? `Sensibilité du dossier: ${sensibilite}` : ""
  ].filter(Boolean);

  const qualifiedMessage = qualification.length > 0
    ? normalizeMultilineText(`${qualification.join("\n")}\n\nDescription:\n${message}`, 3000)
    : message;

  return {
    nom,
    courriel,
    telephone,
    support,
    urgence,
    profil,
    impact,
    sensibilite,
    message: qualifiedMessage,
    sourcePath
  };
};

export const validateStatusLookup = (payload) => {
  const caseId = normalizeCaseId(payload.caseId || payload.dossier);
  const accessCode = normalizeAccessCode(payload.accessCode || payload.code);

  if (!caseId || !accessCode) {
    throw new Error("Entrez un numéro de dossier et un code d'accès valides.");
  }

  return {
    caseId,
    accessCode
  };
};

export const validateAuthorizationApproval = (payload) => {
  const caseId = normalizeCaseId(payload.caseId || payload.dossier);
  const accessCode = normalizeAccessCode(payload.accessCode || payload.code);
  const signerName = normalizeText(payload.signerName || payload.nom || payload.name, 120);
  const consent = payload.consent === true || payload.consent === "true" || payload.consent === "on";

  if (!caseId || !accessCode) {
    throw new Error("Entrez un numéro de dossier et un code d'accès valides.");
  }

  if (!signerName) {
    throw new Error("Inscrivez le nom de la personne qui autorise l'intervention.");
  }

  if (!consent) {
    throw new Error("Confirmez l'autorisation avant de continuer.");
  }

  return {
    caseId,
    accessCode,
    signerName
  };
};

/**
 * Validate query parameters for case listing in ops endpoints.
 * Returns sanitized filters or throws if invalid values provided.
 */
export const validateCaseFilters = (queryParams) => {
  const filters = {};

  if (queryParams.status) {
    const status = normalizeText(queryParams.status, 80);
    if (status && !allowedCaseFilterStatuses.has(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    if (status) filters.status = status;
  }

  if (queryParams.quoteStatus) {
    const quoteStatus = normalizeText(queryParams.quoteStatus, 40);
    // Use the exported allowedQuoteStatuses
    if (quoteStatus && !allowedQuoteStatuses.has(quoteStatus)) {
      throw new Error(`Statut de soumission invalide: ${quoteStatus}`);
    }
    if (quoteStatus) filters.quoteStatus = quoteStatus;
  }

  if (queryParams.urgency) {
    const urgency = normalizeText(queryParams.urgency, 40);
    if (urgency && !allowedUrgencies.has(urgency)) {
      throw new Error(`Niveau d'urgence invalide: ${urgency}`);
    }
    if (urgency) filters.urgency = urgency;
  }

  return filters;
};

const normalizeStep = (step, index) => {
  const title = normalizeText(step?.title, 80);
  const note = normalizeMultilineText(step?.note, 220);
  const state = normalizeText(step?.state, 20).toLowerCase();

  if (!title || !note || !allowedStepStates.has(state)) {
    throw new Error(`Étape invalide à la position ${index + 1}.`);
  }

  return {
    title,
    note,
    state,
    sortOrder: index
  };
};

export const validateTimelineSteps = (steps) => {
  if (typeof steps === "undefined") {
    return null;
  }

  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 8) {
    throw new Error("Fournissez entre 1 et 8 étapes visibles.");
  }

  return steps.map(normalizeStep);
};

const parseAmountToCents = (value) => {
  const normalized = normalizeText(`${value ?? ""}`, 32).replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Montant invalide.");
  }

  const amount = Math.round(Number(normalized) * 100);

  if (!Number.isFinite(amount) || amount < 100 || amount > 10000000) {
    throw new Error("Montant hors limites.");
  }

  return amount;
};

const formatCurrency = (amountCents, currency = "cad") =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: `${currency || "cad"}`.toUpperCase()
  }).format((Number(amountCents) || 0) / 100);

export { formatCurrency };

const generatePaymentRequestId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `PAY-${date}-${token}`;
};

const normalizePaymentKind = (value) => normalizeText(value, 20).toLowerCase();

export const validatePaymentRequestInput = (payload) => {
  const caseId = normalizeCaseId(payload.caseId);
  const paymentKind = normalizePaymentKind(payload.paymentKind || payload.kind || "custom");
  const label = normalizeText(payload.label, 120);
  const description = normalizeMultilineText(payload.description, 300);
  const currency = normalizeText(payload.currency || "cad", 12).toLowerCase() || "cad";
  const amountCents = parseAmountToCents(payload.amount);
  const sendEmail = payload.sendEmail === true || payload.sendEmail === "true" || payload.sendEmail === "on";

  if (!caseId) {
    throw new Error("Numéro de dossier invalide.");
  }

  if (!allowedPaymentKinds.has(paymentKind)) {
    throw new Error("Type de paiement invalide.");
  }

  if (!label) {
    throw new Error("Ajoutez un libellé de paiement.");
  }

  if (!description) {
    throw new Error("Ajoutez une description de paiement.");
  }

  return {
    caseId,
    paymentKind,
    label,
    description,
    currency,
    amountCents,
    sendEmail
  };
};

const nowIso = () => new Date().toISOString();

const buildInitialTimeline = () => [
  {
    title: "Dossier reçu",
    note: "La demande a été enregistrée et qualifiée pour une première lecture.",
    state: "complete",
    sortOrder: 0
  },
  {
    title: "Évaluation en cours",
    note: "Lecture initiale du support et qualification du niveau de risque.",
    state: "active",
    sortOrder: 1
  },
  {
    title: "Soumission",
    note: "Cadre d'intervention et prochaines étapes transmis après l'évaluation.",
    state: "pending",
    sortOrder: 2
  },
  {
    title: "Traitement",
    note: "Commence après autorisation explicite du client.",
    state: "pending",
    sortOrder: 3
  }
];

export const getPublicOrigin = (env, requestUrl = "https://nexuradata.ca/") => {
  const configuredOrigin = normalizeText(env?.PUBLIC_SITE_ORIGIN, 200);

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  return new URL(requestUrl).origin.replace(/\/+$/, "");
};

export const createCase = async (env, submission) => {
  const sql = getDb(env);
  const createdAt = nowIso();
  const caseId = generateCaseId();
  const accessCode = generateAccessCode();
  const accessCodeHash = await hashAccessCode(accessCode, env);
  const accessCodeCiphertext = await encryptAccessCode(accessCode, env);
  const timeline = buildInitialTimeline();
  const automationDraft = buildCaseAutomationDraft(submission);
  const status = "Dossier reçu";
  const nextStep = automationDraft.nextStep;
  const clientSummary = automationDraft.clientSummary;

  await sql`INSERT INTO cases (
    case_id, created_at, updated_at, name, email, phone, support, urgency,
    message, source_path, status, next_step, client_summary,
    access_code_hash, access_code_ciphertext,
    access_code_last_sent_at, status_email_last_sent_at,
    qualification_summary, handling_flags
  ) VALUES (
    ${caseId}, ${createdAt}, ${createdAt}, ${submission.nom}, ${submission.courriel},
    ${submission.telephone}, ${submission.support}, ${submission.urgence},
    ${submission.message}, ${submission.sourcePath}, ${status}, ${nextStep},
    ${clientSummary}, ${accessCodeHash}, ${accessCodeCiphertext}, '', '',
    ${automationDraft.qualificationSummary}, ${automationDraft.handlingFlags}
  )`;

  for (const step of timeline) {
    await sql`INSERT INTO case_updates (
      case_id, kind, title, note, state, sort_order, is_visible,
      created_at, updated_at, created_by
    ) VALUES (
      ${caseId}, 'timeline', ${step.title}, ${step.note}, ${step.state},
      ${step.sortOrder}, 1, ${createdAt}, ${createdAt}, 'system'
    )`;
  }

  await recordCaseEvent(env, caseId, "system", "Dossier ouvert", "Demande initiale reçue via le formulaire public.");

  return {
    caseId,
    accessCode,
    createdAt,
    status,
    nextStep,
    clientSummary,
    ...submission
  };
};

export const recordCaseEvent = async (env, caseId, actor, title, note) => {
  const sql = getDb(env);
  const timestamp = nowIso();

  await sql`INSERT INTO case_updates (
    case_id, kind, title, note, state, sort_order, is_visible,
    created_at, updated_at, created_by
  ) VALUES (
    ${caseId}, 'event', ${title}, ${note}, 'complete', 0, 0,
    ${timestamp}, ${timestamp}, ${normalizeText(actor, 120) || "system"}
  )`;
};

export const markAccessEmailSent = async (env, caseId) => {
  const sql = getDb(env);
  const timestamp = nowIso();

  await sql`UPDATE cases
    SET updated_at = ${timestamp}, access_code_last_sent_at = ${timestamp}
    WHERE case_id = ${caseId}`;
};

export const markStatusEmailSent = async (env, caseId) => {
  const sql = getDb(env);
  const timestamp = nowIso();

  await sql`UPDATE cases
    SET updated_at = ${timestamp}, status_email_last_sent_at = ${timestamp}
    WHERE case_id = ${caseId}`;
};

const mapTimelineStep = (row) => ({
  title: row.title,
  note: row.note,
  state: row.state
});

export const getVisibleTimeline = async (env, caseId) => {
  const sql = getDb(env);
  const results = await sql`SELECT title, note, state
    FROM case_updates
    WHERE case_id = ${caseId} AND kind = 'timeline' AND is_visible = 1
    ORDER BY sort_order ASC, id ASC`;

  return (results || []).map(mapTimelineStep);
};

const getCaseRow = async (env, caseId) => {
  const sql = getDb(env);
  const results = await sql`SELECT
    case_id, created_at, updated_at, name, email, phone, support, urgency,
    message, source_path, status, next_step, client_summary,
    access_code_hash, access_code_ciphertext,
    access_code_last_sent_at, status_email_last_sent_at,
    qualification_summary, internal_notes, handling_flags,
    quote_status, quote_amount_cents, quote_sent_at, quote_approved_at,
    preapproval_confirmed, acquisition_source,
    last_reminder_sent_at, last_client_contact_at
  FROM cases
  WHERE case_id = ${caseId}`;

  return results[0] || null;
};

const mapPaymentRow = (row) => ({
  paymentRequestId: row.payment_request_id,
  caseId: row.case_id,
  paymentKind: row.payment_kind,
  status: row.status,
  label: row.label,
  description: row.description,
  amountCents: row.amount_cents,
  amountFormatted: formatCurrency(row.amount_cents, row.currency),
  currency: row.currency,
  checkoutUrl: row.checkout_url,
  stripeCheckoutSessionId: row.stripe_checkout_session_id,
  stripePaymentIntentId: row.stripe_payment_intent_id,
  stripeSessionStatus: row.stripe_session_status,
  stripePaymentStatus: row.stripe_payment_status,
  customerEmail: row.stripe_customer_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sentAt: row.sent_at,
  paidAt: row.paid_at,
  expiresAt: row.expires_at,
  createdBy: row.created_by
});

const mapPublicPayment = (payment) => {
  const status = normalizeText(payment.status, 24).toLowerCase() || "open";
  const isPayable = status === "open" && normalizeText(payment.checkoutUrl, 2000);

  return {
    paymentRequestId: payment.paymentRequestId,
    paymentKind: payment.paymentKind,
    status,
    label: payment.label,
    description: payment.description,
    amountCents: payment.amountCents,
    amountFormatted: payment.amountFormatted,
    currency: payment.currency,
    checkoutUrl: isPayable ? payment.checkoutUrl : "",
    createdAt: payment.createdAt,
    sentAt: payment.sentAt,
    paidAt: payment.paidAt,
    expiresAt: payment.expiresAt
  };
};

const mapPublicAuthorization = (row) => {
  const quoteStatus = normalizeText(row.quote_status, 20).toLowerCase() || "none";
  const isApproved = quoteStatus === "approved" || Boolean(row.preapproval_confirmed);
  const isAvailable = quoteStatus === "sent" || isApproved;

  return {
    available: isAvailable,
    approved: isApproved,
    quoteStatus,
    quoteAmountCents: row.quote_amount_cents,
    quoteAmountFormatted: row.quote_amount_cents ? formatCurrency(row.quote_amount_cents) : "",
    quoteSentAt: row.quote_sent_at,
    quoteApprovedAt: row.quote_approved_at
  };
};

export const listCasePayments = async (env, caseId) => {
  const sql = getDb(env);
  const normalizedCaseId = normalizeCaseId(caseId);

  if (!normalizedCaseId) {
    return [];
  }

  const results = await sql`SELECT
    payment_request_id, case_id, payment_kind, status, label, description,
    amount_cents, currency, checkout_url, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_session_status, stripe_payment_status,
    stripe_customer_email, created_at, updated_at, sent_at, paid_at,
    expires_at, created_by
  FROM case_payments
  WHERE case_id = ${normalizedCaseId}
  ORDER BY created_at DESC, id DESC`;

  return (results || []).map(mapPaymentRow);
};

export const getPublicCaseByCredentials = async (env, caseId, accessCode) => {
  const row = await getCaseRow(env, caseId);

  if (!row) {
    return null;
  }

  const hashed = await hashAccessCode(accessCode, env);

  if (hashed !== row.access_code_hash) {
    return null;
  }

  const payments = await listCasePayments(env, row.case_id);

  return {
    caseId: row.case_id,
    updatedAt: row.updated_at,
    support: row.support,
    status: row.status,
    nextStep: row.next_step,
    summary: row.client_summary,
    steps: await getVisibleTimeline(env, row.case_id),
    payments: payments.map(mapPublicPayment),
    authorization: mapPublicAuthorization(row)
  };
};

export const approveCaseAuthorization = async (env, payload) => {
  const sql = getDb(env);
  const input = validateAuthorizationApproval(payload);
  const row = await getCaseRow(env, input.caseId);

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const hashed = await hashAccessCode(input.accessCode, env);

  if (hashed !== row.access_code_hash) {
    throw new Error("Dossier introuvable.");
  }

  const quoteStatus = normalizeText(row.quote_status, 20).toLowerCase();

  if (quoteStatus === "approved" || row.preapproval_confirmed) {
    return getPublicCaseByCredentials(env, input.caseId, input.accessCode);
  }

  if (quoteStatus !== "sent") {
    throw new Error("Aucune autorisation active n'est prête pour ce dossier.");
  }

  const timestamp = nowIso();
  const status = "Intervention autorisée";
  const nextStep = "NEXURA prépare les consignes et la séquence de traitement confirmées.";
  const clientSummary = "Votre autorisation a été reçue. Le laboratoire peut maintenant poursuivre selon le cadre transmis et préparer les prochaines actions nécessaires.";

  await sql`UPDATE cases
    SET updated_at = ${timestamp},
        status = ${status},
        next_step = ${nextStep},
        client_summary = ${clientSummary},
        quote_status = 'approved',
        quote_approved_at = ${timestamp},
        preapproval_confirmed = 1,
        last_client_contact_at = ${timestamp}
    WHERE case_id = ${input.caseId}`;

  await sql`UPDATE case_updates
    SET is_visible = 0, updated_at = ${timestamp}
    WHERE case_id = ${input.caseId} AND kind = 'timeline' AND is_visible = 1`;

  const approvedTimeline = [
    {
      title: "Dossier reçu",
      note: "La demande a été enregistrée et qualifiée.",
      state: "complete",
      sortOrder: 0
    },
    {
      title: "Soumission transmise",
      note: "Le cadre d'intervention a été présenté au client.",
      state: "complete",
      sortOrder: 1
    },
    {
      title: "Autorisation reçue",
      note: `Autorisation confirmée par ${input.signerName}.`,
      state: "complete",
      sortOrder: 2
    },
    {
      title: "Préparation du traitement",
      note: "Le laboratoire prépare les consignes, outils ou manipulations applicables au dossier.",
      state: "active",
      sortOrder: 3
    }
  ];

  for (const step of approvedTimeline) {
    await sql`INSERT INTO case_updates (
      case_id, kind, title, note, state, sort_order, is_visible,
      created_at, updated_at, created_by
    ) VALUES (
      ${input.caseId}, 'timeline', ${step.title}, ${step.note}, ${step.state},
      ${step.sortOrder}, 1, ${timestamp}, ${timestamp}, 'client-portal'
    )`;
  }

  await recordCaseEvent(
    env,
    input.caseId,
    "client-portal",
    "Autorisation client reçue",
    `Autorisation confirmée par ${input.signerName}.`
  );

  return getPublicCaseByCredentials(env, input.caseId, input.accessCode);
};

export const listCases = async (env, rawQuery = "", filters = {}) => {
  const sql = getDb(env);
  const query = normalizeText(rawQuery, 160);
  const filterStatus = normalizeText(filters.status || "", 80);
  const filterQuoteStatus = normalizeText(filters.quoteStatus || "", 40);
  const filterUrgency = normalizeText(filters.urgency || "", 40);

  const like = query ? `%${query}%` : null;

  const results = await sql`SELECT
    case_id, created_at, updated_at, name, email, support,
    urgency, status, next_step, quote_status
  FROM cases
  WHERE
    (${like}::text IS NULL OR (case_id LIKE ${like} OR name LIKE ${like} OR email LIKE ${like} OR support LIKE ${like}))
    AND (${filterStatus} = '' OR status = ${filterStatus})
    AND (${filterQuoteStatus} = '' OR quote_status = ${filterQuoteStatus})
    AND (${filterUrgency} = '' OR urgency = ${filterUrgency})
  ORDER BY updated_at DESC
  LIMIT 25`;

  return results || [];
};

export const getCaseDetail = async (env, caseId) => {
  const sql = getDb(env);
  const normalizedCaseId = normalizeCaseId(caseId);
  const row = await getCaseRow(env, normalizedCaseId);

  if (!row) {
    return null;
  }

  const currentSteps = await getVisibleTimeline(env, normalizedCaseId);
  const payments = await listCasePayments(env, normalizedCaseId);
  const history = await sql`SELECT
    kind, title, note, state, is_visible, created_at, created_by
  FROM case_updates
  WHERE case_id = ${normalizedCaseId}
  ORDER BY created_at DESC, id DESC
  LIMIT 20`;

  return {
    caseId: row.case_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    email: row.email,
    phone: row.phone,
    support: row.support,
    urgency: row.urgency,
    message: row.message,
    sourcePath: row.source_path,
    status: row.status,
    nextStep: row.next_step,
    clientSummary: row.client_summary,
    accessCodeLastSentAt: row.access_code_last_sent_at,
    statusEmailLastSentAt: row.status_email_last_sent_at,
    qualificationSummary: row.qualification_summary,
    internalNotes: row.internal_notes,
    handlingFlags: row.handling_flags,
    quoteStatus: row.quote_status,
    quoteAmountCents: row.quote_amount_cents,
    quoteSentAt: row.quote_sent_at,
    quoteApprovedAt: row.quote_approved_at,
    preapprovalConfirmed: Boolean(row.preapproval_confirmed),
    acquisitionSource: row.acquisition_source,
    lastReminderSentAt: row.last_reminder_sent_at,
    lastClientContactAt: row.last_client_contact_at,
    steps: currentSteps,
    payments,
    history: (history || []).map((entry) => ({
      kind: entry.kind,
      title: entry.title,
      note: entry.note,
      state: entry.state,
      isVisible: Boolean(entry.is_visible),
      createdAt: entry.created_at,
      createdBy: entry.created_by
    }))
  };
};

export const updateCaseRecord = async (env, payload, actor) => {
  const sql = getDb(env);
  const caseId = normalizeCaseId(payload.caseId);
  const status = normalizeText(payload.status, 80);
  const nextStep = normalizeText(payload.nextStep, 180);
  const clientSummary = normalizeMultilineText(payload.clientSummary, 800);
  const qualificationSummary = normalizeMultilineText(payload.qualificationSummary ?? "", 1200);
  const internalNotes = normalizeMultilineText(payload.internalNotes ?? "", 3000);
  const handlingFlags = normalizeText(payload.handlingFlags ?? "", 400);
  const acquisitionSource = normalizeText(payload.acquisitionSource ?? "", 120);
  const quoteAmountCents = payload.quoteAmount !== undefined && payload.quoteAmount !== null && payload.quoteAmount !== ""
    ? parseAmountToCents(payload.quoteAmount)
    : null;
  const preapprovalConfirmed = payload.preapprovalConfirmed === true || payload.preapprovalConfirmed === "true" ? 1 : 0;
  const steps = validateTimelineSteps(payload.steps);

  if (!caseId || !status || !nextStep || !clientSummary) {
    throw new Error("Complétez le statut, la prochaine étape et le résumé client.");
  }

  const existing = await getCaseRow(env, caseId);

  if (!existing) {
    throw new Error("Dossier introuvable.");
  }

  const timestamp = nowIso();

  await sql`UPDATE cases
    SET updated_at = ${timestamp},
        status = ${status},
        next_step = ${nextStep},
        client_summary = ${clientSummary},
        qualification_summary = ${qualificationSummary},
        internal_notes = ${internalNotes},
        handling_flags = ${handlingFlags},
        acquisition_source = ${acquisitionSource},
        quote_amount_cents = ${quoteAmountCents},
        preapproval_confirmed = ${preapprovalConfirmed}
    WHERE case_id = ${caseId}`;

  if (steps) {
    await sql`UPDATE case_updates
      SET is_visible = 0, updated_at = ${timestamp}
      WHERE case_id = ${caseId} AND kind = 'timeline' AND is_visible = 1`;

    for (const step of steps) {
      await sql`INSERT INTO case_updates (
        case_id, kind, title, note, state, sort_order, is_visible,
        created_at, updated_at, created_by
      ) VALUES (
        ${caseId}, 'timeline', ${step.title}, ${step.note}, ${step.state},
        ${step.sortOrder}, 1, ${timestamp}, ${timestamp},
        ${normalizeText(actor, 120) || "ops"}
      )`;
    }
  }

  await recordCaseEvent(env, caseId, actor, "Dossier mis à jour", `Statut défini sur "${status}".`);

  return getCaseDetail(env, caseId);
};

export const regenerateCaseAccessCode = async (env, caseId, actor) => {
  const sql = getDb(env);
  const normalizedCaseId = normalizeCaseId(caseId);
  const row = await getCaseRow(env, normalizedCaseId);

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const accessCode = generateAccessCode();
  const accessCodeHash = await hashAccessCode(accessCode, env);
  const accessCodeCiphertext = await encryptAccessCode(accessCode, env);
  const timestamp = nowIso();

  await sql`UPDATE cases
    SET updated_at = ${timestamp},
        access_code_hash = ${accessCodeHash},
        access_code_ciphertext = ${accessCodeCiphertext},
        access_code_last_sent_at = ''
    WHERE case_id = ${normalizedCaseId}`;

  await recordCaseEvent(env, normalizedCaseId, actor, "Code d'accès régénéré", "Un nouveau code d'accès client a été généré.");

  return {
    caseId: normalizedCaseId,
    accessCode,
    email: row.email,
    name: row.name,
    status: row.status,
    nextStep: row.next_step,
    clientSummary: row.client_summary
  };
};

export const getResendableAccessCode = async (env, caseId) => {
  const row = await getCaseRow(env, normalizeCaseId(caseId));

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const accessCode = await decryptAccessCode(row.access_code_ciphertext, env);

  if (!accessCode) {
    throw new Error("Le code actuel n'est pas récupérable. Générez-en un nouveau.");
  }

  return {
    caseId: row.case_id,
    accessCode,
    email: row.email,
    name: row.name,
    status: row.status,
    nextStep: row.next_step,
    clientSummary: row.client_summary
  };
};

const getPaymentRequestRow = async (env, paymentRequestId) => {
  const sql = getDb(env);
  const results = await sql`SELECT
    payment_request_id, case_id, payment_kind, status, label, description,
    amount_cents, currency, checkout_url, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_session_status, stripe_payment_status,
    stripe_customer_email, created_at, updated_at, sent_at, paid_at,
    expires_at, created_by
  FROM case_payments
  WHERE payment_request_id = ${normalizeText(paymentRequestId, 60)}`;

  return results[0] || null;
};

export const markPaymentRequestSent = async (env, paymentRequestId) => {
  const sql = getDb(env);
  const normalizedRequestId = normalizeText(paymentRequestId, 60);
  const timestamp = nowIso();

  await sql`UPDATE case_payments
    SET updated_at = ${timestamp}, sent_at = ${timestamp}
    WHERE payment_request_id = ${normalizedRequestId}`;

  return getPaymentRequestRow(env, normalizedRequestId);
};

export const createCasePaymentRequest = async (env, payload, actor, requestUrl) => {
  const sql = getDb(env);
  const input = validatePaymentRequestInput(payload);
  const row = await getCaseRow(env, input.caseId);

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const paymentRequestId = generatePaymentRequestId();
  const createdAt = nowIso();
  const successUrl = `${getPublicOrigin(env, requestUrl)}/paiement-reussi.html?caseId=${encodeURIComponent(input.caseId)}&paymentRequestId=${encodeURIComponent(paymentRequestId)}`;
  const cancelUrl = `${getPublicOrigin(env, requestUrl)}/paiement-annule.html?caseId=${encodeURIComponent(input.caseId)}&paymentRequestId=${encodeURIComponent(paymentRequestId)}`;
  const session = await createHostedCheckoutSession(env, {
    caseId: input.caseId,
    paymentRequestId,
    paymentKind: input.paymentKind,
    label: input.label,
    description: input.description,
    amountCents: input.amountCents,
    currency: input.currency,
    customerEmail: row.email,
    successUrl,
    cancelUrl
  });
  const localStatus = `${session?.payment_status || ""}`.toLowerCase() === "paid" ? "paid" : "open";
  const expiresAt = Number.isFinite(Number(session?.expires_at))
    ? new Date(Number(session.expires_at) * 1000).toISOString()
    : "";

  await sql`INSERT INTO case_payments (
    payment_request_id, case_id, payment_kind, status, label, description,
    amount_cents, currency, checkout_url, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_session_status, stripe_payment_status,
    stripe_customer_email, created_at, updated_at, sent_at, paid_at,
    expires_at, created_by
  ) VALUES (
    ${paymentRequestId}, ${input.caseId}, ${input.paymentKind}, ${localStatus},
    ${input.label}, ${input.description}, ${input.amountCents}, ${input.currency},
    ${normalizeText(session?.url, 2000)},
    ${normalizeText(session?.id, 120)},
    ${normalizeText(`${session?.payment_intent || ""}`, 120)},
    ${normalizeText(`${session?.status || ""}`, 40).toLowerCase()},
    ${normalizeText(`${session?.payment_status || ""}`, 40).toLowerCase()},
    ${row.email}, ${createdAt}, ${createdAt}, '',
    ${localStatus === "paid" ? createdAt : ""},
    ${expiresAt},
    ${normalizeText(actor, 120) || "ops"}
  )`;

  await recordCaseEvent(
    env,
    input.caseId,
    actor,
    "Demande de paiement créée",
    `${input.label} · ${formatCurrency(input.amountCents, input.currency)}.`
  );

  const saved = await getPaymentRequestRow(env, paymentRequestId);
  return saved ? mapPaymentRow(saved) : null;
};

export const updateQuoteStatus = async (env, payload, actor) => {
  const sql = getDb(env);
  const caseId = normalizeCaseId(payload.caseId);
  const targetStatus = normalizeText(payload.quoteStatus, 20).toLowerCase();

  if (!caseId) {
    throw new Error("Numéro de dossier invalide.");
  }

  if (!allowedQuoteStatuses.has(targetStatus) || targetStatus === "none") {
    throw new Error("Statut de soumission invalide.");
  }

  const row = await getCaseRow(env, caseId);

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const timestamp = nowIso();

  if (targetStatus === "sent") {
    const quoteAmount = (payload.quoteAmount !== undefined && payload.quoteAmount !== null && payload.quoteAmount !== "")
      ? parseAmountToCents(payload.quoteAmount)
      : row.quote_amount_cents;

    await sql`UPDATE cases
      SET updated_at = ${timestamp}, quote_status = ${targetStatus},
          quote_sent_at = ${timestamp}, quote_amount_cents = ${quoteAmount}
      WHERE case_id = ${caseId}`;
  } else if (targetStatus === "approved") {
    await sql`UPDATE cases
      SET updated_at = ${timestamp}, quote_status = ${targetStatus},
          quote_approved_at = ${timestamp}
      WHERE case_id = ${caseId}`;
  } else {
    await sql`UPDATE cases
      SET updated_at = ${timestamp}, quote_status = ${targetStatus}
      WHERE case_id = ${caseId}`;
  }

  const titleMap = {
    sent: "Soumission envoyée",
    approved: "Soumission approuvée",
    expired: "Soumission expirée",
    declined: "Soumission refusée",
    draft: "Soumission en brouillon"
  };

  await recordCaseEvent(env, caseId, actor, titleMap[targetStatus] || "Soumission mise à jour", `Statut de la soumission défini sur "${targetStatus}".`);

  return getCaseDetail(env, caseId);
};

export const logReminder = async (env, payload, actor) => {
  const sql = getDb(env);
  const caseId = normalizeCaseId(payload.caseId);
  const reminderType = normalizeText(payload.reminderType, 40).toLowerCase();
  const message = normalizeMultilineText(payload.message || "", 500);

  if (!caseId) {
    throw new Error("Numéro de dossier invalide.");
  }

  if (!allowedReminderTypes.has(reminderType)) {
    throw new Error("Type de relance invalide.");
  }

  const row = await getCaseRow(env, caseId);

  if (!row) {
    throw new Error("Dossier introuvable.");
  }

  const timestamp = nowIso();

  await sql`UPDATE cases
    SET updated_at = ${timestamp}, last_reminder_sent_at = ${timestamp},
        last_client_contact_at = ${timestamp}
    WHERE case_id = ${caseId}`;

  const typeLabels = {
    quote_follow_up: "Relance soumission",
    payment_follow_up: "Relance paiement",
    missing_information: "Demande d'information",
    general_follow_up: "Relance générale"
  };

  await recordCaseEvent(env, caseId, actor, typeLabels[reminderType] || "Relance envoyée", message || `Type: ${reminderType}`);

  return getCaseDetail(env, caseId);
};

export const syncPaymentRequestFromStripe = async (env, event) => {
  const sql = getDb(env);
  const session = event?.data?.object;

  if (!session || session.object !== "checkout.session") {
    return null;
  }

  const paymentRequestId = normalizeText(session?.metadata?.payment_request_id || session?.client_reference_id, 60);

  if (!paymentRequestId) {
    return null;
  }

  const existing = await getPaymentRequestRow(env, paymentRequestId);

  if (!existing) {
    return null;
  }

  const eventType = normalizeText(event?.type, 80);
  let localStatus = existing.status || "open";

  if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
    localStatus = "paid";
  } else if (eventType === "checkout.session.expired") {
    localStatus = "expired";
  } else if (eventType === "checkout.session.async_payment_failed") {
    localStatus = "failed";
  }

  const timestamp = nowIso();
  const paidAt = localStatus === "paid" ? existing.paid_at || timestamp : existing.paid_at || "";
  const expiresAt = Number.isFinite(Number(session?.expires_at))
    ? new Date(Number(session.expires_at) * 1000).toISOString()
    : existing.expires_at || "";

  await sql`UPDATE case_payments
    SET
      updated_at = ${timestamp},
      status = ${localStatus},
      checkout_url = ${normalizeText(session?.url || existing.checkout_url, 2000)},
      stripe_checkout_session_id = ${normalizeText(session?.id || existing.stripe_checkout_session_id, 120)},
      stripe_payment_intent_id = ${normalizeText(`${session?.payment_intent || existing.stripe_payment_intent_id || ""}`, 120)},
      stripe_session_status = ${normalizeText(`${session?.status || existing.stripe_session_status || ""}`, 40).toLowerCase()},
      stripe_payment_status = ${normalizeText(`${session?.payment_status || existing.stripe_payment_status || ""}`, 40).toLowerCase()},
      paid_at = ${paidAt},
      expires_at = ${expiresAt}
    WHERE payment_request_id = ${paymentRequestId}`;

  if (localStatus !== existing.status) {
    const title =
      localStatus === "paid"
        ? "Paiement reçu"
        : localStatus === "expired"
          ? "Lien de paiement expiré"
          : "Paiement non complété";
    const note =
      localStatus === "paid"
        ? `${existing.label} réglé pour ${formatCurrency(existing.amount_cents, existing.currency)}.`
        : localStatus === "expired"
          ? `Le lien de paiement ${paymentRequestId} a expiré.`
          : `Le paiement ${paymentRequestId} n'a pas abouti.`;

    await recordCaseEvent(env, existing.case_id, "stripe-webhook", title, note);
  }

  const updated = await getPaymentRequestRow(env, paymentRequestId);
  return updated ? mapPaymentRow(updated) : null;
};

export const authorizeOpsRequest = (request, env) => {
  const configuredEmails = normalizeText(env?.OPS_ACCESS_ALLOWED_EMAILS, 500)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const configuredDomain = normalizeText(env?.OPS_ACCESS_ALLOWED_DOMAIN, 120).toLowerCase();
  const authenticatedEmail = normalizeText(
    request.headers.get("Cf-Access-Authenticated-User-Email") || request.headers.get("cf-access-authenticated-user-email"),
    160
  ).toLowerCase();
  const hostname = new URL(request.url).hostname;
  const isLocal = localHostnames.has(hostname);

  if (isLocal) {
    return {
      ok: true,
      actor: authenticatedEmail || "local-dev"
    };
  }

  if (configuredEmails.length === 0 && !configuredDomain) {
    return {
      ok: false
    };
  }

  if (!authenticatedEmail) {
    return {
      ok: false
    };
  }

  if (configuredEmails.includes(authenticatedEmail)) {
    return {
      ok: true,
      actor: authenticatedEmail
    };
  }

  if (configuredDomain && authenticatedEmail.endsWith(`@${configuredDomain}`)) {
    return {
      ok: true,
      actor: authenticatedEmail
    };
  }

  return {
    ok: false
  };
};

export const listQuotes = async (env, filters = {}) => {
  const sql = getDb(env);
  const filterQuoteStatus = normalizeText(filters.quoteStatus || "", 40);
  const filterQuery = normalizeText(filters.query || "", 160);
  const like = filterQuery ? `%${filterQuery}%` : null;

  const results = await sql`SELECT
    case_id, name, email, status, next_step, quote_status,
    quote_amount_cents, quote_sent_at, quote_approved_at,
    preapproval_confirmed, last_reminder_sent_at, updated_at
  FROM cases
  WHERE quote_status != 'none'
    AND (${filterQuoteStatus} = '' OR quote_status = ${filterQuoteStatus})
    AND (${like}::text IS NULL OR (case_id LIKE ${like} OR name LIKE ${like} OR email LIKE ${like}))
  ORDER BY
    CASE quote_status WHEN 'approved' THEN 0 WHEN 'sent' THEN 1 WHEN 'draft' THEN 2 WHEN 'expired' THEN 3 WHEN 'declined' THEN 4 ELSE 5 END,
    updated_at DESC
  LIMIT 50`;

  return (results || []).map((row) => {
    let reminderDue = "";

    if (row.quote_status === "sent" && row.quote_sent_at) {
      const sentDate = new Date(row.quote_sent_at);
      const daysSinceSent = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceSent >= 7) {
        reminderDue = "urgente";
      } else if (daysSinceSent >= 3) {
        reminderDue = "suggérée";
      }
    }

    return {
      caseId: row.case_id,
      clientName: row.name,
      clientEmail: row.email,
      caseStatus: row.status,
      nextStep: row.next_step,
      quoteStatus: row.quote_status,
      quoteAmountCents: row.quote_amount_cents,
      quoteAmountFormatted: row.quote_amount_cents ? formatCurrency(row.quote_amount_cents) : "",
      quoteSentAt: row.quote_sent_at,
      quoteApprovedAt: row.quote_approved_at,
      preapprovalConfirmed: Boolean(row.preapproval_confirmed),
      lastReminderSentAt: row.last_reminder_sent_at,
      reminderDue,
      updatedAt: row.updated_at
    };
  });
};

export const listAllPayments = async (env, filters = {}) => {
  const sql = getDb(env);
  const filterStatus = normalizeText(filters.status || "", 40);
  const filterKind = normalizeText(filters.kind || "", 40);
  const filterQuery = normalizeText(filters.query || "", 160);
  const like = filterQuery ? `%${filterQuery}%` : null;

  const results = await sql`SELECT
    cp.payment_request_id, cp.case_id, c.name, c.email,
    cp.payment_kind, cp.status, cp.label, cp.amount_cents, cp.currency,
    cp.created_at, cp.sent_at, cp.paid_at, cp.expires_at
  FROM case_payments cp
  LEFT JOIN cases c ON cp.case_id = c.case_id
  WHERE
    (${filterStatus} = '' OR cp.status = ${filterStatus})
    AND (${filterKind} = '' OR cp.payment_kind = ${filterKind})
    AND (${like}::text IS NULL OR (cp.case_id LIKE ${like} OR c.name LIKE ${like} OR c.email LIKE ${like} OR cp.payment_request_id LIKE ${like}))
  ORDER BY
    CASE cp.status WHEN 'open' THEN 0 WHEN 'paid' THEN 1 WHEN 'expired' THEN 2 WHEN 'failed' THEN 3 ELSE 4 END,
    cp.created_at DESC
  LIMIT 50`;

  return (results || []).map((row) => ({
    paymentRequestId: row.payment_request_id,
    caseId: row.case_id,
    clientName: row.name,
    clientEmail: row.email,
    paymentKind: row.payment_kind,
    status: row.status,
    label: row.label,
    amountCents: row.amount_cents,
    amountFormatted: formatCurrency(row.amount_cents, row.currency),
    currency: row.currency,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    expiresAt: row.expires_at
  }));
};

export const listFollowUps = async (env, filters = {}) => {
  const sql = getDb(env);
  const knownReasons = new Set([
    "quote_pending",
    "payment_open",
    "awaiting_authorization",
    "missing_information",
    "new_unqualified",
    "dormant"
  ]);
  const rawReason = normalizeText(filters.reason || "", 60);
  // Unknown reasons fall back to no reason filter (preserves pre-refactor behavior).
  const filterReason = knownReasons.has(rawReason) ? rawReason : "";
  const filterQuery = normalizeText(filters.query || "", 160);
  const daysSince = Number(filters.daysSinceLastContact) || 0;
  const like = filterQuery ? `%${filterQuery}%` : null;

  // Single query that conditionally applies the reason-specific predicate.
  // The ${filterReason} = '<key>' guard means each branch only contributes when
  // its reason is selected; an empty reason matches all rows.
  // NULLIF guards `last_client_contact_at::timestamptz` against the empty-string
  // default — Postgres does not guarantee left-to-right short-circuit on OR,
  // so the cast can be evaluated even when the empty-check is true.
  //
  // Uses a LEFT JOIN LATERAL with subquery instead of scalar subquery to avoid N+1.
  const results = await sql`SELECT
    c.case_id, c.name, c.email, c.status, c.next_step, c.quote_status,
    c.last_reminder_sent_at, c.last_client_contact_at, c.updated_at,
    cp_latest.status AS latest_payment_status
  FROM cases c
  LEFT JOIN LATERAL (
    SELECT status FROM case_payments
    WHERE case_id = c.case_id
    ORDER BY created_at DESC LIMIT 1
  ) cp_latest ON TRUE
  WHERE c.status NOT IN ('completed', 'closed')
    AND (
      ${filterReason} = ''
      OR (${filterReason} = 'quote_pending' AND c.quote_status = 'sent')
      OR (${filterReason} = 'payment_open' AND c.case_id IN (SELECT case_id FROM case_payments WHERE status = 'open'))
      OR (${filterReason} = 'awaiting_authorization' AND c.quote_status = 'approved' AND c.preapproval_confirmed = 0)
      OR (${filterReason} = 'missing_information' AND c.status IN ('awaiting_client', 'En attente du client') AND c.quote_status IN ('none', 'draft'))
      OR (${filterReason} = 'new_unqualified' AND c.status IN ('new', 'Dossier reçu'))
      OR (${filterReason} = 'dormant' AND c.status IN ('awaiting_client', 'paused', 'En attente du client', 'En pause') AND c.updated_at < NOW() - INTERVAL '7 days')
    )
    AND (${like}::text IS NULL OR (c.case_id LIKE ${like} OR c.name LIKE ${like} OR c.email LIKE ${like}))
    AND (
      ${daysSince} = 0
      OR NULLIF(c.last_client_contact_at, '') IS NULL
      OR NULLIF(c.last_client_contact_at, '')::timestamptz < NOW() - (${daysSince} || ' days')::interval
    )
  ORDER BY CASE WHEN c.last_client_contact_at = '' THEN 0 ELSE 1 END, c.last_client_contact_at ASC, c.updated_at ASC
  LIMIT 50`;
  return mapFollowUpResults(results);
};

const mapFollowUpResults = (results) =>
  (results || []).map((row) => ({
    caseId: row.case_id,
    clientName: row.name,
    clientEmail: row.email,
    status: row.status,
    nextStep: row.next_step,
    quoteStatus: row.quote_status,
    latestPaymentStatus: row.latest_payment_status || "none",
    lastReminderSentAt: row.last_reminder_sent_at,
    lastClientContactAt: row.last_client_contact_at,
    updatedAt: row.updated_at
  }));
