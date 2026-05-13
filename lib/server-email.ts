type EmailDelivery = {
  sent: boolean;
  reason?: string;
  error?: string;
  id?: string;
};

type EmailPayload = {
  to: string[];
  subject: string;
  text: string;
  html: string;
};

type AssessmentPayload = {
  company?: string;
  name?: string;
  email?: string;
  problem?: string;
  tools?: string;
  teams?: string;
  urgency?: string;
  locale?: string;
};

type AssessmentEstimate = {
  complexity?: string;
  scope?: string;
  range?: string;
  nextStep?: string;
};

type PaymentLinkPayload = {
  email?: string;
  locale?: string;
  checkoutUrl?: string | null;
  productName?: string;
  amount?: string;
  sessionId?: string;
};

type PaymentCompletedPayload = {
  eventId?: string;
  eventType?: string;
  sessionId?: string;
  customerEmail?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  productId?: string | null;
  locale?: string | null;
};

const DEFAULT_TEAM_RECIPIENTS = [
  "dany@nexuradata.ca",
  "olivier@nexuradata.ca",
  "contact@nexuradata.ca",
];

const normalizeText = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const escapeHtml = (value: unknown) =>
  `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

const formatTextLines = (lines: Array<string | false | null | undefined>) =>
  lines.filter(Boolean).join("\n");

const emailKey = (...parts: Array<string | number | null | undefined>) =>
  parts
    .map((part) => normalizeText(`${part || ""}`, 120))
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 180);

const getPublicOrigin = (request?: Request) =>
  normalizeText(process.env.NEXT_PUBLIC_BASE_URL, 240) ||
  normalizeText(request?.headers.get("origin") || "", 240) ||
  "https://nexuradata.ca";

const parseRecipientList = (value: string | string[]) => {
  const rawValue = Array.isArray(value) ? value.join(",") : value;
  return [
    ...new Set(
      rawValue
        .split(/[,;\s]+/)
        .map((email) => normalizeText(email.toLowerCase(), 200))
        .filter((email) => email && isValidEmail(email))
    ),
  ];
};

export const getTeamNotificationRecipients = () =>
  parseRecipientList(
    process.env.TEAM_INBOX_EMAILS ||
      process.env.TEAM_INBOX_EMAIL ||
      process.env.LAB_INBOX_EMAIL ||
      DEFAULT_TEAM_RECIPIENTS.join(",")
  );

const emailRow = (label: string, value: unknown) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(232,228,220,0.10);font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#827c72;text-transform:uppercase;letter-spacing:0.12em;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(232,228,220,0.10);font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e8e4dc;text-align:right;">${escapeHtml(value || "Non precise")}</td>
  </tr>`;

const emailBlock = (text: unknown) => `
  <div style="background:rgba(232,228,220,0.05);border-left:2px solid #bd7630;padding:14px 16px;margin:16px 0 0;">
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#c8c4bc;">${escapeHtml(text || "Non fourni").replace(/\n/g, "<br>")}</p>
  </div>`;

const buildEmailHtml = (eyebrow: string, title: string, body: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#11110f;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#11110f;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#0d0d0b;border:1px solid rgba(232,228,220,0.16);">
        <tr><td style="padding:24px 28px 0;">
          <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.28em;color:#bd7630;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#f4efe4;text-transform:uppercase;">NEXURA Analytics</p>
          <div style="height:1px;background:rgba(232,228,220,0.12);margin:20px 0 0;"></div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#f4efe4;line-height:1.16;">${escapeHtml(title)}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <div style="height:1px;background:rgba(232,228,220,0.12);margin-bottom:16px;"></div>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6f695f;">Message operationnel confidentiel. NEXURA Analytics · Quebec, Canada · <a href="https://nexuradata.ca" style="color:#bd7630;text-decoration:none;">nexuradata.ca</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export const sendResendEmail = async (
  payload: EmailPayload,
  idempotencyKey?: string
): Promise<EmailDelivery> => {
  const apiKey = normalizeText(process.env.RESEND_API_KEY, 256);
  const from = normalizeText(process.env.RESEND_FROM_EMAIL, 200) || "NEXURA <noreply@nexuradata.ca>";

  if (!apiKey) {
    return { sent: false, reason: "not-configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, ...payload }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      return {
        sent: false,
        reason: `api-${response.status}`,
        error: data?.message || text || "Resend request failed",
      };
    }

    return { sent: true, id: data?.id };
  } catch (error) {
    return {
      sent: false,
      reason: "network-error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const sendTeamAssessmentEmail = async (
  payload: AssessmentPayload,
  estimate: AssessmentEstimate,
  request?: Request,
  leadId?: string | null
) => {
  const recipients = getTeamNotificationRecipients();

  if (!recipients.length) {
    return { sent: false, reason: "missing-team-inbox" };
  }

  const origin = getPublicOrigin(request);
  const company = normalizeText(payload.company, 160) || "Organisation";
  const subject = `[NEXURA] Action equipe - Evaluation operationnelle - ${company}`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Valider l'estimation, prioriser le dossier et preparer la recommandation humaine.",
    `Console equipe: ${origin}/operations/`,
    "Decision rapide: APPROVE = lancer la revue; ADJUST = modifier scope/montant; HOLD = demander plus d'information.",
    "",
    "ORGANISATION",
    `Organisation: ${company}`,
    `Contact: ${payload.name || "Non fourni"}`,
    `Courriel: ${payload.email || "Non fourni"}`,
    `Urgence: ${payload.urgency || "Non precisee"}`,
    `Equipes: ${payload.teams || "Non precise"}`,
    `Outils: ${payload.tools || "Non fourni"}`,
    "",
    "ESTIMATION",
    `Complexite: ${estimate.complexity || "Non precisee"}`,
    `Portee: ${estimate.scope || "Non precisee"}`,
    `Fourchette: ${estimate.range || "Non precisee"}`,
    `Prochaine etape: ${estimate.nextStep || "Revue humaine"}`,
    leadId ? `Lead Supabase: ${leadId}` : false,
    "",
    "PROBLEME",
    payload.problem || "Non fourni",
  ]);
  const html = buildEmailHtml(
    "Action equipe",
    "Evaluation operationnelle recue",
    `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#c8c4bc;">Valider l'estimation, prioriser le dossier et preparer la recommandation humaine.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${emailRow("Organisation", company)}
      ${emailRow("Contact", payload.name)}
      ${emailRow("Courriel", payload.email)}
      ${emailRow("Urgence", payload.urgency)}
      ${emailRow("Equipes", payload.teams)}
      ${emailRow("Complexite", estimate.complexity)}
      ${emailRow("Fourchette", estimate.range)}
      ${emailRow("Lead", leadId || "Non disponible")}
    </table>
    ${emailBlock(payload.problem)}
    ${emailBlock(estimate.scope || estimate.nextStep || "Validation humaine requise")}`
  );

  return sendResendEmail({ to: recipients, subject, text, html }, emailKey("team-assessment", leadId, payload.email));
};

export const sendClientAssessmentReportEmail = async (
  payload: AssessmentPayload,
  estimate: AssessmentEstimate,
  request?: Request,
  leadId?: string | null
) => {
  if (!isValidEmail(payload.email)) {
    return { sent: false, reason: "missing-client-email" };
  }

  const isFr = payload.locale === "fr";
  const origin = getPublicOrigin(request);
  const assessmentUrl = `${origin}/${isFr ? "fr" : "en"}/operational-assessment`;
  const subject = isFr
    ? `Votre rapport d'evaluation operationnelle - ${payload.company || "NEXURA"}`
    : `Your operational assessment report - ${payload.company || "NEXURA"}`;
  const text = isFr
    ? formatTextLines([
        `Bonjour ${payload.name || ""},`,
        "",
        "Votre evaluation operationnelle a ete recue et un premier rapport a ete genere.",
        `Complexite: ${estimate.complexity || "A valider"}`,
        `Portee recommandee: ${estimate.scope || "Revue humaine requise"}`,
        `Fourchette indicative: ${estimate.range || "A confirmer"}`,
        `Prochaine etape: ${estimate.nextStep || "Notre equipe validera les informations avant toute recommandation finale."}`,
        "",
        `Page d'evaluation: ${assessmentUrl}`,
        "",
        "NEXURA Analytics",
      ])
    : formatTextLines([
        `Hello ${payload.name || ""},`,
        "",
        "Your operational assessment was received and an initial report has been generated.",
        `Complexity: ${estimate.complexity || "To validate"}`,
        `Recommended scope: ${estimate.scope || "Human review required"}`,
        `Indicative range: ${estimate.range || "To confirm"}`,
        `Next step: ${estimate.nextStep || "Our team will validate the information before any final recommendation."}`,
        "",
        `Assessment page: ${assessmentUrl}`,
        "",
        "NEXURA Analytics",
      ]);
  const html = buildEmailHtml(
    isFr ? "Rapport client" : "Client report",
    isFr ? "Votre premiere lecture operationnelle" : "Your initial operational read",
    `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#c8c4bc;">${
      isFr
        ? "Votre evaluation a ete recue. Ce rapport resume la premiere lecture automatisee avant validation humaine."
        : "Your assessment was received. This report summarizes the first automated read before human validation."
    }</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${emailRow(isFr ? "Organisation" : "Organization", payload.company)}
      ${emailRow(isFr ? "Complexite" : "Complexity", estimate.complexity)}
      ${emailRow(isFr ? "Portee" : "Scope", estimate.scope)}
      ${emailRow(isFr ? "Fourchette" : "Range", estimate.range)}
      ${emailRow(isFr ? "Prochaine etape" : "Next step", estimate.nextStep)}
    </table>
    ${emailBlock(payload.problem)}
    <p style="margin:22px 0 0;"><a href="${escapeHtml(assessmentUrl)}" style="display:inline-block;background:#bd7630;color:#0d0d0b;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:12px 18px;">${
      isFr ? "Continuer" : "Continue"
    }</a></p>`
  );

  return sendResendEmail({ to: [payload.email!.toLowerCase()], subject, text, html }, emailKey("client-assessment", leadId, payload.email));
};

export const sendClientPaymentLinkEmail = async (payload: PaymentLinkPayload, request?: Request) => {
  if (!isValidEmail(payload.email) || !payload.checkoutUrl) {
    return { sent: false, reason: "missing-payment-link" };
  }

  const isFr = payload.locale === "fr";
  const subject = isFr ? "Lien de paiement securise NEXURA" : "NEXURA secure payment link";
  const text = isFr
    ? formatTextLines([
        "Bonjour,",
        "",
        "Votre lien de paiement securise est pret pour la revue operationnelle.",
        `Service: ${payload.productName || "Revue operationnelle"}`,
        `Montant: ${payload.amount || "250 CAD"}`,
        `Paiement: ${payload.checkoutUrl}`,
        "",
        "NEXURA Analytics",
      ])
    : formatTextLines([
        "Hello,",
        "",
        "Your secure payment link is ready for the operational review.",
        `Service: ${payload.productName || "Operational Review"}`,
        `Amount: ${payload.amount || "250 CAD"}`,
        `Payment: ${payload.checkoutUrl}`,
        "",
        "NEXURA Analytics",
      ]);
  const html = buildEmailHtml(
    isFr ? "Paiement client" : "Client payment",
    isFr ? "Lien de paiement securise" : "Secure payment link",
    `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#c8c4bc;">${
      isFr
        ? "Votre lien de paiement est pret. Le paiement permet de lancer la revue humaine de votre evaluation."
        : "Your payment link is ready. Payment starts the human review of your assessment."
    }</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${emailRow(isFr ? "Service" : "Service", payload.productName)}
      ${emailRow(isFr ? "Montant" : "Amount", payload.amount)}
      ${emailRow("Session", payload.sessionId)}
    </table>
    <p style="margin:22px 0 0;"><a href="${escapeHtml(payload.checkoutUrl)}" style="display:inline-block;background:#bd7630;color:#0d0d0b;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:12px 18px;">${
      isFr ? "Payer maintenant" : "Pay now"
    }</a></p>`
  );

  return sendResendEmail({ to: [payload.email!.toLowerCase()], subject, text, html }, emailKey("client-payment", payload.sessionId, payload.email));
};

export const sendTeamPaymentStartedEmail = async (payload: PaymentLinkPayload, request?: Request) => {
  const recipients = getTeamNotificationRecipients();

  if (!recipients.length) {
    return { sent: false, reason: "missing-team-inbox" };
  }

  const subject = `[NEXURA] Action equipe - Lien de paiement cree - ${payload.email || "client"}`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Un lien de paiement de revue operationnelle a ete cree.",
    `Courriel client: ${payload.email || "Non fourni"}`,
    `Service: ${payload.productName || "Operational Review"}`,
    `Montant: ${payload.amount || "250 CAD"}`,
    `Session Stripe: ${payload.sessionId || "Non disponible"}`,
    `Lien: ${payload.checkoutUrl || "Non disponible"}`,
  ]);
  const html = buildEmailHtml(
    "Action equipe",
    "Lien de paiement cree",
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${emailRow("Courriel client", payload.email)}
      ${emailRow("Service", payload.productName)}
      ${emailRow("Montant", payload.amount)}
      ${emailRow("Session Stripe", payload.sessionId)}
    </table>
    ${emailBlock(payload.checkoutUrl || "Lien non disponible")}`
  );

  return sendResendEmail({ to: recipients, subject, text, html }, emailKey("team-payment-started", payload.sessionId, payload.email));
};

export const sendTeamPaymentCompletedEmail = async (payload: PaymentCompletedPayload, request?: Request) => {
  const recipients = getTeamNotificationRecipients();

  if (!recipients.length) {
    return { sent: false, reason: "missing-team-inbox" };
  }

  const amount = payload.amountTotal ? `${(payload.amountTotal / 100).toFixed(2)} ${payload.currency || "cad"}` : "Non precise";
  const subject = `[NEXURA] Paiement confirme - ${amount} - revue a lancer`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Un paiement Stripe a ete confirme. Lancer la revue humaine et activer le suivi client.",
    `Evenement: ${payload.eventType || "Non disponible"}`,
    `Courriel client: ${payload.customerEmail || "Non fourni"}`,
    `Montant: ${amount}`,
    `Session Stripe: ${payload.sessionId || "Non disponible"}`,
    `Produit: ${payload.productId || "Non precise"}`,
  ]);
  const html = buildEmailHtml(
    "Paiement confirme",
    "Revue humaine a lancer",
    `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#c8c4bc;">Un paiement Stripe a ete confirme. Lancer la revue humaine et activer le suivi client.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${emailRow("Evenement", payload.eventType)}
      ${emailRow("Courriel client", payload.customerEmail)}
      ${emailRow("Montant", amount)}
      ${emailRow("Session Stripe", payload.sessionId)}
      ${emailRow("Produit", payload.productId)}
    </table>`
  );

  return sendResendEmail({ to: recipients, subject, text, html }, emailKey("team-payment-completed", payload.eventId, payload.sessionId));
};