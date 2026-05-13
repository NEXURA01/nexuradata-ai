import { getTeamNotificationRecipients, sendResendEmail } from "@/lib/server-email";
import { guardPublicPost, hasFilledHoneypot, jsonWithSecurity } from "@/lib/request-guard";

const normalizeText = (value: unknown, maxLength = 1200) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const escapeHtml = (value: unknown) =>
  `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "contact", maxRequests: 5 });

  if (guarded) {
    return guarded;
  }

  const body = await req.json().catch(() => ({}));

  if (hasFilledHoneypot(body)) {
    return jsonWithSecurity({ ok: true });
  }

  const name = normalizeText(body.name, 180);
  const email = normalizeText(body.email, 220).toLowerCase();
  const message = normalizeText(body.message, 2400);
  const locale = normalizeText(body.locale, 12) || "fr";

  if (!name || !isValidEmail(email) || !message) {
    return jsonWithSecurity({ ok: false, error: "invalid-contact-payload" }, { status: 400 });
  }

  const recipients = getTeamNotificationRecipients();

  if (!recipients.length) {
    return jsonWithSecurity({ ok: false, error: "missing-team-inbox" }, { status: 503 });
  }

  const subject = `[NEXURA] Nouveau contact - ${name}`;
  const text = [
    "NOUVEAU CONTACT SITE",
    `Nom: ${name}`,
    `Courriel: ${email}`,
    `Langue: ${locale}`,
    "",
    "MESSAGE",
    message,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#0b0d10;color:#e8e4dc;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:28px;">
      <p style="margin:0 0 8px;color:#c17c45;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;">Contact site</p>
      <h1 style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Nouveau message</h1>
      <div style="border-top:1px solid rgba(232,228,220,.14);border-bottom:1px solid rgba(232,228,220,.14);padding:16px 0;margin-bottom:20px;">
        <p style="margin:0 0 8px;"><strong>Nom:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px;"><strong>Courriel:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#e8e4dc;">${escapeHtml(email)}</a></p>
        <p style="margin:0;"><strong>Langue:</strong> ${escapeHtml(locale)}</p>
      </div>
      <p style="white-space:pre-wrap;line-height:1.65;color:#c8c4bc;">${escapeHtml(message)}</p>
    </div>
  </body></html>`;

  const delivery = await sendResendEmail({ to: recipients, subject, text, html }, `contact-${email}-${Date.now()}`);

  if (!delivery.sent) {
    return jsonWithSecurity({ ok: false, error: delivery.reason || "contact-email-failed" }, { status: 503 });
  }

  return jsonWithSecurity({ ok: true });
}