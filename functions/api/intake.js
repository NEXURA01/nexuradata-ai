import { createCase, validateSubmission } from "../_lib/cases.js";
import { sendClientAccessEmail, sendLabNotificationEmail } from "../_lib/email.js";
import { json, methodNotAllowed, onOptions, parsePayload } from "../_lib/http.js";
import { checkRateLimit, tooManyRequests } from "../_lib/rate-limit.js";

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  const limit = checkRateLimit(context.request, 3);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  try {
    if (!context.env?.DATABASE_URL) {
      return json(
        {
          ok: false,
          fallback: "mailto",
          message: "Le backend de prise en charge n'est pas encore configuré. Le formulaire bascule vers le courriel préparé."
        },
        { status: 503 }
      );
    }

    if (!context.env?.ACCESS_CODE_SECRET) {
      return json(
        {
          ok: false,
          message: "Configuration incomplète. Contactez l'administrateur."
        },
        { status: 503 }
      );
    }

    const payload = await parsePayload(context.request);

    if (context.env?.TURNSTILE_SECRET_KEY) {
      const token = payload["cf-turnstile-response"] || "";
      if (!token) {
        return json({ ok: false, message: "Vérification de sécurité incomplète. Veuillez recharger la page et réessayer." }, { status: 400 });
      }
      const form = new URLSearchParams();
      form.set("secret", context.env.TURNSTILE_SECRET_KEY);
      form.set("response", token);
      const cfIp = context.request.headers.get("CF-Connecting-IP") || "";
      if (cfIp) form.set("remoteip", cfIp);
      const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const result = await verification.json();
      if (!result.success) {
        return json({ ok: false, message: "Vérification de sécurité échouée. Veuillez recharger et réessayer." }, { status: 400 });
      }
    }

    const submission = validateSubmission(payload);
    const intakeRecord = await createCase(context.env, submission);
    const [teamDelivery, clientDelivery] = await Promise.all([
      sendLabNotificationEmail(context.env, intakeRecord, context.request.url),
      sendClientAccessEmail(
        context.env,
        {
          caseId: intakeRecord.caseId,
          accessCode: intakeRecord.accessCode,
          email: intakeRecord.courriel,
          name: intakeRecord.nom,
          status: intakeRecord.status,
          nextStep: intakeRecord.nextStep
        },
        context.request.url,
        "initial"
      )
    ]);

    return json({
      ok: true,
      caseId: intakeRecord.caseId,
      message: "Demande reçue. Un numéro de dossier initial a été généré.",
      nextStep: "L'équipe opérationnelle peut maintenant qualifier le cas et préparer la suite.",
      delivery: {
        team: teamDelivery.sent ? "sent" : teamDelivery.reason,
        client: clientDelivery.sent ? "sent" : clientDelivery.reason
      }
    });
  } catch (error) {
    const isUserError = error instanceof Error && (
      error.message.includes("obligatoire") ||
      error.message.includes("invalide") ||
      error.message.includes("format") ||
      error.message.includes("courriel")
    );
    return json(
      {
        ok: false,
        message: isUserError ? error.message : "Erreur de traitement."
      },
      { status: 400 }
    );
  }
};

export const onRequest = methodNotAllowed;
