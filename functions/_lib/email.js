import {
  formatCurrency,
  getCaseDetail,
  getPublicOrigin,
  markAccessEmailSent,
  markPaymentRequestSent,
  markStatusEmailSent,
  normalizeText,
  recordCaseEvent
} from "./cases.js";

const escapeHtml = (value) =>
  `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTextLines = (lines) => lines.filter(Boolean).join("\n");

/** Wrap email content in the NEXURA branded shell. */
const buildEmailHtml = (content) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NEXURA</title></head>
<body style="margin:0;padding:0;background:#f0ede8;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background:#f0ede8;">
<tr><td align="center" style="padding:28px 16px;">
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:560px;background:#0d0d0b;border-radius:6px;">
  <tr><td style="padding:22px 28px 0;">
    <p style="margin:0 0 3px;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;letter-spacing:0.14em;color:#e8e4dc;text-transform:uppercase;">NEXURA&#8202;DATA</p>
    <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.22em;color:#6a655e;text-transform:uppercase;">Récupération de données · Forensique numérique</p>
    <div style="height:1px;background:rgba(232,228,220,0.1);"></div>
  </td></tr>
  <tr><td style="padding:24px 28px;">${content}</td></tr>
  <tr><td style="padding:0 28px 22px;">
    <div style="height:1px;background:rgba(232,228,220,0.1);margin-bottom:16px;"></div>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#4a4540;line-height:1.7;">Ce message est confidentiel et destiné uniquement à son destinataire. Toute diffusion ou utilisation non autorisée est interdite.<br>NEXURA · Québec, Canada · <a href="https://nexuradata.ca" style="color:#6a655e;text-decoration:none;">nexuradata.ca</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

/** Labelled data row for branded emails. */
const emailRow = (label, value) =>
  `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e8e4dc;line-height:1.5;"><span style="display:block;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#6a655e;text-transform:uppercase;margin-bottom:3px;">${label}</span>${escapeHtml(value)}</p>`;

/** Highlighted badge for case IDs, codes, etc. */
const emailBadge = (label, value) =>
  `<div style="background:rgba(232,228,220,0.06);border:1px solid rgba(232,228,220,0.12);border-radius:4px;padding:13px 16px;margin:0 0 18px;"><span style="display:block;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#6a655e;text-transform:uppercase;margin-bottom:6px;">${label}</span><span style="font-family:'Courier New',Courier,monospace;font-size:21px;font-weight:700;color:#e8e4dc;letter-spacing:0.06em;">${escapeHtml(value)}</span></div>`;

/** Primary CTA button. */
const emailCta = (label, url) =>
  `<p style="margin:22px 0 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#e8e4dc;color:#0d0d0b;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;padding:11px 22px;border-radius:3px;">${label} →</a></p>`;

/** Quoted text block (descriptions, summaries). */
const emailBlock = (text) =>
  `<div style="background:rgba(232,228,220,0.05);border-left:2px solid rgba(232,228,220,0.18);padding:12px 16px;border-radius:0 3px 3px 0;margin:0 0 4px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c8c4bc;line-height:1.65;">${escapeHtml(text).replace(/\n/g, "<br>")}</p></div>`;

const emailSectionTitle = (label) =>
  `<p style="margin:22px 0 8px;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#6a655e;text-transform:uppercase;">${escapeHtml(label)}</p>`;

const emailActionBlock = (title, text) =>
  `<div style="background:rgba(183,106,55,0.12);border:1px solid rgba(183,106,55,0.28);border-radius:4px;padding:14px 16px;margin:0 0 18px;"><span style="display:block;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#b76a37;text-transform:uppercase;margin-bottom:6px;">Action équipe</span><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e8e4dc;line-height:1.6;"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(text)}</p></div>`;

const emailApprovalBlock = (primaryAction, secondaryAction, holdAction) =>
  `<div style="background:rgba(232,228,220,0.07);border:1px solid rgba(232,228,220,0.14);border-radius:4px;padding:14px 16px;margin:0 0 18px;"><span style="display:block;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#a09a90;text-transform:uppercase;margin-bottom:8px;">Approval rapide</span><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e8e4dc;line-height:1.55;"><strong>APPROVE</strong> — ${escapeHtml(primaryAction)}</p><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c8c4bc;line-height:1.55;"><strong>ADJUST</strong> — ${escapeHtml(secondaryAction)}</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c8c4bc;line-height:1.55;"><strong>HOLD</strong> — ${escapeHtml(holdAction)}</p></div>`;

const sendResendEmail = async (env, payload, idempotencyKey) => {
  const apiKey = normalizeText(env?.RESEND_API_KEY, 256);
  const from = normalizeText(env?.RESEND_FROM_EMAIL, 200);

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "not-configured"
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      body: JSON.stringify({
        from,
        ...payload
      })
    });

    if (!response.ok) {
      return {
        sent: false,
        reason: `api-${response.status}`,
        error: await response.text()
      };
    }

    return {
      sent: true,
      ...(await response.json())
    };
  } catch (error) {
    return {
      sent: false,
      reason: "network-error",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

const parseRecipientList = (value) => {
  const rawValue = Array.isArray(value) ? value.join(",") : `${value || ""}`;
  return [...new Set(
    rawValue
      .split(/[,;\s]+/)
      .map((email) => normalizeText(email, 200))
      .filter(Boolean)
  )];
};

const getTeamNotificationRecipients = (env) => parseRecipientList(
  env?.TEAM_INBOX_EMAILS || env?.TEAM_INBOX_EMAIL || env?.LAB_INBOX_EMAIL
);

const emailKey = (...parts) => parts
  .map((part) => normalizeText(`${part || ""}`, 120))
  .filter(Boolean)
  .join("-")
  .replace(/[^a-zA-Z0-9_-]/g, "-")
  .slice(0, 180);

const formatAmount = (amountCents, currency = "cad") => {
  const amount = Number(amountCents || 0);
  return amount > 0 ? formatCurrency(amount, currency) : "Non precise";
};

const formatRange = (minCents, maxCents, currency = "cad") => {
  const min = Number(minCents || 0);
  const max = Number(maxCents || 0);

  if (min > 0 && max > 0) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
  if (min > 0) return `A partir de ${formatCurrency(min, currency)}`;
  if (max > 0) return `Jusqu'a ${formatCurrency(max, currency)}`;
  return "Non precise";
};

export const sendLabNotificationEmail = async (env, intakeRecord, requestUrl) => {
  const recipients = getTeamNotificationRecipients(env);

  if (!recipients.length) {
    return {
      sent: false,
      reason: "missing-team-inbox"
    };
  }

  const portalUrl = `${getPublicOrigin(env, requestUrl)}/operations/`;
  const subject = `[NEXURA] Action équipe - Nouveau dossier ${intakeRecord.caseId} - ${intakeRecord.urgence}`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Qualifier le dossier, confirmer la priorite et assigner la prochaine etape.",
    `EMPLOYE: ${portalUrl}`,
    "Decision rapide: APPROVE = assigner et repondre; ADJUST = corriger priorite/scope; HOLD = demander plus d'information.",
    "",
    "CLIENT",
    `Dossier: ${intakeRecord.caseId}`,
    `Nom: ${intakeRecord.nom}`,
    `Courriel: ${intakeRecord.courriel}`,
    `Téléphone: ${intakeRecord.telephone || "Non fourni"}`,
    "",
    "DEMANDE",
    `Support: ${intakeRecord.support}`,
    `Urgence: ${intakeRecord.urgence}`,
    "Description du problème:",
    intakeRecord.message,
    "",
    "SUIVI INTERNE",
    `Code d'accès initial: ${intakeRecord.accessCode}`,
    `Source: ${intakeRecord.sourcePath}`
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 18px;font-family:'Courier New',Courier,monospace;font-size:13px;letter-spacing:0.1em;color:#a09a90;text-transform:uppercase;">Nouveau dossier pour l'equipe</p>` +
    emailActionBlock("Dossier à qualifier", "Confirmer la priorité, assigner la prochaine étape et répondre depuis EMPLOYE.") +
    emailApprovalBlock("Assigner le dossier et répondre au client.", "Corriger la priorité, le support ou la prochaine étape.", "Demander les détails manquants avant de poursuivre.") +
    emailBadge("Référence", intakeRecord.caseId) +
    emailSectionTitle("Client") +
    emailRow("Nom", intakeRecord.nom) +
    emailRow("Courriel", intakeRecord.courriel) +
    emailRow("Téléphone", intakeRecord.telephone || "Non fourni") +
    emailSectionTitle("Demande") +
    emailRow("Support", intakeRecord.support) +
    emailRow("Urgence", intakeRecord.urgence) +
    emailSectionTitle("Description du problème") +
    emailBlock(intakeRecord.message) +
    emailSectionTitle("Suivi interne") +
    emailRow("Code d'accès initial", intakeRecord.accessCode) +
    emailRow("Source", intakeRecord.sourcePath) +
    emailCta("Ouvrir EMPLOYE", portalUrl)
  );

  return sendResendEmail(
    env,
    {
      to: recipients,
      subject,
      text,
      html
    },
    `lab-intake-${intakeRecord.caseId}`
  );
};

export const sendTeamOperationalAssessmentEmail = async (env, detail, requestUrl) => {
  const recipients = getTeamNotificationRecipients(env);

  if (!recipients.length) {
    return {
      sent: false,
      reason: "missing-team-inbox"
    };
  }

  const payload = detail?.payload || {};
  const lead = detail?.lead || {};
  const estimate = detail?.estimate || {};
  const workflowCase = detail?.workflowCase || detail?.workflow_case || {};
  const portalUrl = `${getPublicOrigin(env, requestUrl)}/operations/`;
  const estimateRange = formatRange(estimate.estimated_min, estimate.estimated_max);
  const subject = `[NEXURA] Action équipe - Évaluation opérationnelle - ${payload.organization || "Organisation"}`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Valider l'estimation, prioriser le dossier et preparer la recommandation humaine.",
    `EMPLOYE: ${portalUrl}`,
    "Decision rapide: APPROVE = laisser le paiement Stripe de revue operationnelle avancer; ADJUST = modifier scope/montant avant suivi; HOLD = demander plus d'information.",
    "Note: OpenAI prepare l'estimation. Stripe complete le paiement. La validation humaine reste obligatoire.",
    "",
    "ORGANISATION",
    `Organisation: ${payload.organization || "Non fournie"}`,
    `Contact: ${payload.contact_name || "Non fourni"}`,
    `Courriel: ${payload.email || "Non fourni"}`,
    `Urgence: ${payload.urgency || "Non precisee"}`,
    `Equipes impliquees: ${payload.teams_involved || "Non precise"}`,
    "",
    "ESTIMATION",
    `Fourchette indicative: ${estimateRange}`,
    `Confiance: ${estimate.confidence_score || estimate.confidence || "Non precisee"}`,
    `Lead Supabase: ${lead.id || "Non disponible"}`,
    `Workflow case: ${workflowCase.id || "Non disponible"}`,
    "",
    "Resume operationnel:",
    payload.workflow_summary || "Non fourni",
    "",
    "Solution recommandee:",
    estimate.recommended_scope || workflowCase.recommended_solution || "Validation humaine requise",
    "",
    `EMPLOYE: ${portalUrl}`
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 18px;font-family:'Courier New',Courier,monospace;font-size:13px;letter-spacing:0.1em;color:#a09a90;text-transform:uppercase;">Evaluation operationnelle recue</p>` +
    emailActionBlock("Évaluation à valider", "Prioriser le dossier, vérifier la fourchette indicative et préparer la recommandation humaine.") +
    emailApprovalBlock("Accepter l'estimation IA et laisser la revue Stripe avancer.", "Modifier le scope, la fourchette ou le niveau de revue avant le suivi.", "Bloquer la suite et demander les informations manquantes au client.") +
    emailBadge("Organisation", payload.organization || "Non fournie") +
    emailSectionTitle("Organisation") +
    emailRow("Contact", payload.contact_name || "Non fourni") +
    emailRow("Courriel", payload.email || "Non fourni") +
    emailRow("Urgence", payload.urgency || "Non precisee") +
    emailRow("Equipes impliquees", payload.teams_involved || "Non precise") +
    emailSectionTitle("Estimation") +
    emailRow("Fourchette indicative", estimateRange) +
    emailRow("Confiance", estimate.confidence_score || estimate.confidence || "Non precisee") +
    emailRow("Lead Supabase", lead.id || "Non disponible") +
    emailRow("Workflow case", workflowCase.id || "Non disponible") +
    emailSectionTitle("Resume operationnel") +
    emailBlock(payload.workflow_summary || "Non fourni") +
    emailSectionTitle("Solution recommandee") +
    emailBlock(estimate.recommended_scope || workflowCase.recommended_solution || "Validation humaine requise") +
    emailCta("Ouvrir EMPLOYE", portalUrl)
  );

  return sendResendEmail(
    env,
    {
      to: recipients,
      subject,
      text,
      html
    },
    emailKey("team-assessment", lead.id, workflowCase.id, payload.email)
  );
};

export const sendTeamPaymentCompletedEmail = async (env, detail, requestUrl) => {
  const recipients = getTeamNotificationRecipients(env);

  if (!recipients.length) {
    return {
      sent: false,
      reason: "missing-team-inbox"
    };
  }

  const payment = detail?.payment || {};
  const workflowCase = detail?.workflowCase || {};
  const event = detail?.event || {};
  const session = event?.data?.object || {};
  const portalUrl = `${getPublicOrigin(env, requestUrl)}/operations/`;
  const amount = formatAmount(payment.amount || session.amount_total, payment.currency || session.currency || "cad");
  const customerEmail = payment.customer_email || session.customer_details?.email || session.customer_email || "Non fourni";
  const subject = `[NEXURA] Paiement confirmé - ${amount} - revue à lancer`;
  const text = formatTextLines([
    "ACTION EQUIPE",
    "Lancer la revue humaine, valider l'estimation et preparer la prochaine recommandation.",
    `EMPLOYE: ${portalUrl}`,
    "Decision rapide: APPROVE = lancer la revue; ADJUST = corriger le workflow interne; HOLD = verifier paiement/client avant action.",
    "",
    "PAIEMENT",
    `Montant: ${amount}`,
    `Courriel client: ${customerEmail}`,
    `Paiement: ${payment.payment_request_id || payment.id || "Non disponible"}`,
    `Session Stripe: ${payment.stripe_session_id || session.id || "Non disponible"}`,
    `Workflow case: ${workflowCase.id || payment.workflow_case_id || "Non disponible"}`,
    `Evenement Stripe: ${event.type || "Non disponible"}`,
    ""
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 18px;font-family:'Courier New',Courier,monospace;font-size:13px;letter-spacing:0.1em;color:#a09a90;text-transform:uppercase;">Paiement operationnel confirme</p>` +
    emailActionBlock("Revue humaine à lancer", "Valider l'estimation, préparer la prochaine recommandation et activer le suivi opérationnel.") +
    emailApprovalBlock("Démarrer la revue humaine et activer le suivi du workflow.", "Corriger le workflow interne ou le montant de suivi si nécessaire.", "Vérifier le paiement ou l'identité client avant toute action.") +
    emailBadge("Montant", amount) +
    emailSectionTitle("Paiement") +
    emailRow("Courriel client", customerEmail) +
    emailRow("Paiement", payment.payment_request_id || payment.id || "Non disponible") +
    emailRow("Session Stripe", payment.stripe_session_id || session.id || "Non disponible") +
    emailRow("Workflow case", workflowCase.id || payment.workflow_case_id || "Non disponible") +
    emailRow("Evenement Stripe", event.type || "Non disponible") +
    emailCta("Ouvrir EMPLOYE", portalUrl)
  );

  return sendResendEmail(
    env,
    {
      to: recipients,
      subject,
      text,
      html
    },
    emailKey("team-payment", event.id, payment.id, payment.stripe_session_id || session.id)
  );
};

export const sendClientAccessEmail = async (env, record, requestUrl, reason = "initial") => {
  const statusUrl = `${getPublicOrigin(env, requestUrl)}/suivi-dossier-client-montreal.html`;
  const subject =
    reason === "regenerated"
      ? `Nouveau code d'accès pour votre dossier ${record.caseId}`
      : reason === "resent"
        ? `Rappel du code d'accès pour votre dossier ${record.caseId}`
      : `Dossier ${record.caseId} ouvert chez NEXURA`;
  const intro =
    reason === "regenerated"
      ? "Un nouveau code d'accès a été généré pour votre dossier."
      : reason === "resent"
        ? "Voici à nouveau le code d'accès actuel de votre dossier."
      : "Votre demande a été reçue et un dossier initial a été ouvert.";
  const text = formatTextLines([
    `Bonjour ${record.name || ""},`,
    "",
    intro,
    `Numéro de dossier: ${record.caseId}`,
    `Code d'accès: ${record.accessCode}`,
    `Statut actuel: ${record.status}`,
    `Prochaine étape: ${record.nextStep}`,
    "",
    `Portail client: ${statusUrl}`,
    "",
    "Conservez ce courriel. Ce code permet d'afficher l'état utile du dossier sans exposer de détails sensibles.",
    "",
    "NEXURA"
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8e4dc;line-height:1.6;">Bonjour ${escapeHtml(record.name || "")},</p>` +
    `<p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a09a90;line-height:1.6;">${escapeHtml(intro)}</p>` +
    emailBadge("Numéro de dossier", record.caseId) +
    emailBadge("Code d'accès", record.accessCode) +
    emailRow("Statut actuel", record.status) +
    emailRow("Prochaine étape", record.nextStep) +
    `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a655e;line-height:1.65;">Conservez ce courriel. Ce code vous permet de consulter l'état de votre dossier sans exposer de détails sensibles.</p>` +
    emailCta("Accéder au suivi", statusUrl)
  );

  const delivery = await sendResendEmail(
    env,
    {
      to: [record.email],
      subject,
      text,
      html
    },
    `${reason}-access-${record.caseId}`
  );

  if (delivery.sent) {
    await markAccessEmailSent(env, record.caseId);
    await recordCaseEvent(
      env,
      record.caseId,
      "system",
      reason === "regenerated" ? "Code d'accès régénéré et envoyé" : "Code d'accès envoyé",
      `Un courriel d'accès client a été envoyé à ${record.email}.`
    );
  }

  return delivery;
};

export const sendClientStatusEmail = async (env, caseId, requestUrl, actor = "ops") => {
  const detail = await getCaseDetail(env, caseId);

  if (!detail) {
    throw new Error("Dossier introuvable.");
  }

  const statusUrl = `${getPublicOrigin(env, requestUrl)}/suivi-dossier-client-montreal.html`;
  const text = formatTextLines([
    `Bonjour ${detail.name},`,
    "",
    `Le dossier ${detail.caseId} a été mis à jour.`,
    `Statut: ${detail.status}`,
    `Prochaine étape: ${detail.nextStep}`,
    "",
    detail.clientSummary,
    "",
    `Portail client: ${statusUrl}`,
    "",
    "NEXURA"
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8e4dc;line-height:1.6;">Bonjour ${escapeHtml(detail.name)},</p>` +
    emailBadge("Dossier mis à jour", detail.caseId) +
    emailRow("Statut", detail.status) +
    emailRow("Prochaine étape", detail.nextStep) +
    `<p style="margin:18px 0 8px;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#6a655e;text-transform:uppercase;">Résumé</p>` +
    emailBlock(detail.clientSummary) +
    emailCta("Voir le suivi", statusUrl)
  );

  const delivery = await sendResendEmail(
    env,
    {
      to: [detail.email],
      subject: `Mise à jour du dossier ${detail.caseId}`,
      text,
      html
    },
    `status-update-${detail.caseId}-${detail.updatedAt}`
  );

  if (delivery.sent) {
    await markStatusEmailSent(env, detail.caseId);
    await recordCaseEvent(env, detail.caseId, actor, "Mise à jour envoyée au client", `Un courriel de suivi a été envoyé à ${detail.email}.`);
  }

  return {
    detail,
    delivery
  };
};

export const sendClientPaymentLinkEmail = async (env, payment, requestUrl, actor = "ops") => {
  if (!payment?.customerEmail || !payment?.checkoutUrl) {
    throw new Error("Demande de paiement incomplète.");
  }

  const statusUrl = `${getPublicOrigin(env, requestUrl)}/suivi-dossier-client-montreal.html`;
  const amount = formatCurrency(payment.amountCents, payment.currency);
  const subject = `${payment.label} - ${amount} - ${payment.caseId}`;
  const text = formatTextLines([
    "Bonjour,",
    "",
    `Un lien de paiement a été préparé pour le dossier ${payment.caseId}.`,
    `Libellé: ${payment.label}`,
    `Montant: ${amount}`,
    "",
    payment.description,
    "",
    `Paiement sécurisé: ${payment.checkoutUrl}`,
    `Suivi du dossier: ${statusUrl}`,
    "",
    "NEXURA"
  ]);
  const html = buildEmailHtml(
    `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8e4dc;line-height:1.6;">Bonjour,</p>` +
    `<p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a09a90;line-height:1.6;">Un lien de paiement a été préparé pour votre dossier.</p>` +
    emailBadge("Dossier", payment.caseId) +
    emailRow("Libellé", payment.label) +
    emailRow("Montant", amount) +
    `<p style="margin:18px 0 8px;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;color:#6a655e;text-transform:uppercase;">Détails</p>` +
    emailBlock(payment.description) +
    emailCta("Payer maintenant", payment.checkoutUrl) +
    `<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a655e;">Vous pouvez aussi <a href="${escapeHtml(statusUrl)}" style="color:#a09a90;">consulter votre dossier</a> à tout moment.</p>`
  );

  const delivery = await sendResendEmail(
    env,
    {
      to: [payment.customerEmail],
      subject,
      text,
      html
    },
    `payment-link-${payment.paymentRequestId}`
  );

  if (delivery.sent) {
    await markPaymentRequestSent(env, payment.paymentRequestId);
    await recordCaseEvent(
      env,
      payment.caseId,
      actor,
      "Lien de paiement envoyé",
      `${payment.label} transmis à ${payment.customerEmail}.`
    );
  }

  return delivery;
};
