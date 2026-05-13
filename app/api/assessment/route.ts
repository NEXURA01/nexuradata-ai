import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import {
  sendClientAssessmentReportEmail,
  sendTeamAssessmentEmail,
} from "@/lib/server-email";
import { guardPublicPost, hasFilledHoneypot, jsonWithSecurity } from "@/lib/request-guard";

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

const normalizeText = (value: unknown, maxLength = 2400) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

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
    const locale = normalizeText(body.locale, 12) || "fr";

    if (!company || !name || !isValidEmail(email) || !problem || !urgency) {
      return jsonWithSecurity({ error: "Invalid assessment payload" }, { status: 400 });
    }

    // Generate AI estimate
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

    // Parse AI response
    let estimate;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      estimate = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      estimate = {
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
      };
    }

    // Store lead in Supabase
    const teamCount = Number.parseInt(`${teams || ""}`, 10);
    const { data: lead, error: dbError } = await supabase.from("leads").insert({
      company_name: company,
      contact_name: name,
      email,
      problem_description: problem,
      current_tools: tools,
      team_count: Number.isFinite(teamCount) ? teamCount : null,
      urgency,
      locale,
      ai_estimate: estimate,
      status: "new",
    }).select("id").maybeSingle();

    if (dbError) {
      console.error("Supabase error:", dbError);
    }

    const emailPayload = { company, name, email, problem, tools, teams, urgency, locale };
    const [teamDelivery, clientDelivery] = await Promise.allSettled([
      sendTeamAssessmentEmail(emailPayload, estimate, req, lead?.id || null),
      sendClientAssessmentReportEmail(emailPayload, estimate, req, lead?.id || null),
    ]);

    return jsonWithSecurity({
      estimate,
      delivery: {
        team: teamDelivery.status === "fulfilled"
          ? (teamDelivery.value.sent ? "sent" : teamDelivery.value.reason)
          : "notification-error",
        client: clientDelivery.status === "fulfilled"
          ? (clientDelivery.value.sent ? "sent" : clientDelivery.value.reason)
          : "notification-error",
      },
    });
  } catch (error) {
    console.error("Assessment error:", error);
    return jsonWithSecurity(
      { error: "Failed to process assessment" },
      { status: 500 }
    );
  }
}
