import { createClient } from "@supabase/supabase-js";
import {
  sendClientLeadMagnetEmail,
  sendTeamLeadMagnetEmail,
} from "@/lib/server-email";
import { guardPublicPost, hasFilledHoneypot, jsonWithSecurity } from "@/lib/request-guard";

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

const normalizeText = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const storeLeadCapture = async (payload: Record<string, unknown>) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("lead_captures")
    .insert({
      email: payload.email,
      company: payload.company,
      name: payload.name,
      role: payload.role,
      bottleneck: payload.bottleneck,
      offer: payload.offer,
      locale: payload.locale,
      source_path: payload.sourcePath,
      source_label: payload.sourceLabel,
      utm_source: payload.utmSource,
      utm_medium: payload.utmMedium,
      utm_campaign: payload.utmCampaign,
      referrer: payload.referrer,
      follow_up_consent: payload.consent,
      follow_up_next_at: payload.consent ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Lead capture storage error:", error);
    return null;
  }

  return data?.id || null;
};

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "lead-magnet", maxRequests: 6 });

  if (guarded) {
    return guarded;
  }

  const body = await req.json().catch(() => ({}));

  if (hasFilledHoneypot(body)) {
    return jsonWithSecurity({ ok: true });
  }

  const payload = {
    email: normalizeText(body.email, 220).toLowerCase(),
    company: normalizeText(body.company, 180),
    name: normalizeText(body.name, 180),
    role: normalizeText(body.role, 160),
    bottleneck: normalizeText(body.bottleneck, 1200),
    offer: normalizeText(body.offer, 80) || "operational_notes",
    locale: normalizeText(body.locale, 12) || "fr",
    sourcePath: normalizeText(body.sourcePath, 240),
    sourceLabel: normalizeText(body.sourceLabel, 120) || "lead_magnet",
    utmSource: normalizeText(body.utmSource, 120),
    utmMedium: normalizeText(body.utmMedium, 120),
    utmCampaign: normalizeText(body.utmCampaign, 160),
    referrer: normalizeText(body.referrer, 240),
    consent: body.consent !== false,
  };

  if (!isValidEmail(payload.email) || !payload.consent) {
    return jsonWithSecurity({ ok: false, error: "invalid-lead-payload" }, { status: 400 });
  }

  const leadCaptureId = await storeLeadCapture(payload);
  const emailPayload = { ...payload, followUpConsent: payload.consent };
  const [teamDelivery, clientDelivery] = await Promise.allSettled([
    sendTeamLeadMagnetEmail(emailPayload, req, leadCaptureId),
    sendClientLeadMagnetEmail(emailPayload, req),
  ]);

  const team = teamDelivery.status === "fulfilled"
    ? (teamDelivery.value.sent ? "sent" : teamDelivery.value.reason)
    : "notification-error";
  const client = clientDelivery.status === "fulfilled"
    ? (clientDelivery.value.sent ? "sent" : clientDelivery.value.reason)
    : "notification-error";

  if (team !== "sent" && client !== "sent" && !leadCaptureId) {
    return jsonWithSecurity({ ok: false, error: "lead-delivery-failed" }, { status: 503 });
  }

  return jsonWithSecurity({
    ok: true,
    leadCaptureId,
    delivery: { team, client },
  });
}