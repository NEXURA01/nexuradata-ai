import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import {
  sendClientAssessmentReportEmail,
  sendTeamAssessmentEmail,
} from "@/lib/server-email";
import { guardPublicPost, hasFilledHoneypot, jsonWithSecurity } from "@/lib/request-guard";

type AssessmentEstimate = {
  complexity: string;
  scope: string;
  range: string;
  nextStep: string;
};

const isValidEmail = (value: unknown) => {
  const email = typeof value === "string" ? value.trim() : "";
  if (email.length < 5 || email.length > 254 || /\s/.test(email)) return false;
  const at = email.indexOf("@");
  const lastDot = email.lastIndexOf(".");
  return at > 0 && lastDot > at + 1 && lastDot < email.length - 1;
};

const normalizeText = (value: unknown, maxLength = 2400) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const fallbackEstimate = (locale: string): AssessmentEstimate => ({
  complexity: "Medium",
  scope:
    locale === "fr"
      ? "Analyse approfondie requise"
      : "Detailed analysis required",
  range: "$2,500 - $15,000",
  nextStep:
    locale === "fr"
      ? "Réservez une revue opérationnelle pour obtenir des recommandations détaillées."
      : "Book an operational review to get detailed recommendations.",
});

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "assessment", maxRequests: 4 });

  if (guarded) {
    return guarded;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonWithSecurity(
        { error: "Assessment storage is not configured" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));

    if (hasFilledHoneypot(body)) {
      return jsonWithSecurity({ ok: true });
    }

    const company = normalizeText(body.company, 180);
    const name = normalizeText(body.name, 180);
    const email = normalizeText(body.email, 220).toLowerCase();
    const problem = normalizeText(body.problem, 3000);
    const tools = normalizeText(body.tools, 1200);
    const teams = normalizeText(body.teams, 40);
    const urgency = normalizeText(body.urgency, 80);
    const locale = normalizeText(body.locale, 12) === "en" ? "en" : "fr";
    const sourcePath = normalizeText(body.sourcePath, 240);
    const sourceLabel = normalizeText(body.sourceLabel, 120) || "assessment_form";
    const utmSource = normalizeText(body.utmSource, 120);
    const utmMedium = normalizeText(body.utmMedium, 120);
    const utmCampaign = normalizeText(body.utmCampaign, 160);
    const referrer = normalizeText(body.referrer, 240);
    const followUpConsent = body.followUpConsent !== false;

    if (!company || !name || !isValidEmail(email) || !problem || !urgency) {
      return jsonWithSecurity({ error: "Invalid assessment payload" }, { status: 400 });
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You are an operational analyst at NEXURA. Analyze the client's operational problem and provide a structured estimate.

Rules:
- Never give exact prices, only ranges
- Never promise specific results
- Don't invent details not provided
- Focus on identifying complexity and scope
- Be professional but accessible
- Respond in ${locale === "fr" ? "French" : "English"}

Output format (JSON):
{
  "complexity": "Low | Medium | High | Critical",
  "scope": "Brief description of recommended work",
  "range": "Price range in CAD (e.g., $2,500 - $10,000)",
  "nextStep": "What happens after they book the review"
}`,
      prompt: `Company: ${company}
Name: ${name}
Main Problem: ${problem}
Current Tools: ${tools || "Not specified"}
Number of Teams: ${teams || "Not specified"}
Urgency: ${urgency}

Analyze this operational problem and provide an estimate.`,
      maxOutputTokens: 500,
    });

    let estimate = fallbackEstimate(locale);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<AssessmentEstimate>;
        estimate = {
          complexity: normalizeText(parsed.complexity, 80) || estimate.complexity,
          scope: normalizeText(parsed.scope, 500) || estimate.scope,
          range: normalizeText(parsed.range, 80) || estimate.range,
          nextStep: normalizeText(parsed.nextStep, 500) || estimate.nextStep,
        };
      }
    } catch {
      estimate = fallbackEstimate(locale);
    }

    const teamCount = Number.parseInt(`${teams || ""}`, 10);
    const leadScore = [company, name, email, problem, tools, teams, urgency].filter(Boolean).length * 10;
    const legacyMessage = [
      `Problem: ${problem}`,
      tools ? `Tools: ${tools}` : "Tools: Not specified",
      teams ? `Teams: ${teams}` : "Teams: Not specified",
      `Urgency: ${urgency}`,
    ].join("\n");

    const { data: lead, error: dbError } = await supabase.from("leads").insert({
      name,
      company,
      message: legacyMessage,
      source: sourceLabel,
      company_name: company,
      contact_name: name,
      email,
      problem_description: problem,
      current_tools: tools,
      team_count: Number.isFinite(teamCount) ? teamCount : null,
      urgency,
      locale,
      ai_estimate: estimate,
      source_path: sourcePath,
      source_label: sourceLabel,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      referrer,
      follow_up_consent: followUpConsent,
      follow_up_next_at: followUpConsent ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      last_client_report_sent_at: new Date().toISOString(),
      lead_score: leadScore,
      status: "new",
      metadata: {
        sourcePath,
        sourceLabel,
        utmSource,
        utmMedium,
        utmCampaign,
        referrer,
      },
    }).select("id").maybeSingle();

    if (dbError) {
      console.error("Supabase error:", dbError);
      return jsonWithSecurity({ error: "Assessment storage failed" }, { status: 503 });
    }

    const emailPayload = {
      company,
      name,
      email,
      problem,
      tools,
      teams,
      urgency,
      locale,
      sourcePath,
      sourceLabel,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
      followUpConsent,
    };
    const [teamDelivery, clientDelivery] = await Promise.allSettled([
      sendTeamAssessmentEmail(emailPayload, estimate, req, lead?.id || null),
      sendClientAssessmentReportEmail(emailPayload, estimate, req, lead?.id || null),
    ]);

    const delivery = {
      team: teamDelivery.status === "fulfilled"
        ? (teamDelivery.value.sent ? "sent" : teamDelivery.value.reason)
        : "notification-error",
      client: clientDelivery.status === "fulfilled"
        ? (clientDelivery.value.sent ? "sent" : clientDelivery.value.reason)
        : "notification-error",
    };

    if (delivery.team !== "sent" || delivery.client !== "sent") {
      return jsonWithSecurity({ error: "Assessment delivery failed", estimate, leadId: lead?.id || null, delivery }, { status: 503 });
    }

    return jsonWithSecurity({
      estimate,
      leadId: lead?.id || null,
      delivery,
    });
  } catch (error) {
    console.error("Assessment error:", error);
    return jsonWithSecurity(
      { error: "Failed to process assessment" },
      { status: 500 }
    );
  }
}
