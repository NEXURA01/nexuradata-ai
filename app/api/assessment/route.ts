import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { company, name, email, problem, tools, teams, urgency, locale } =
      await req.json();

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
    const { error: dbError } = await supabase.from("leads").insert({
      company_name: company,
      contact_name: name,
      email,
      problem_description: problem,
      current_tools: tools,
      team_count: teams ? parseInt(teams) : null,
      urgency,
      locale,
      ai_estimate: estimate,
      status: "new",
    });

    if (dbError) {
      console.error("Supabase error:", dbError);
    }

    return Response.json({ estimate });
  } catch (error) {
    console.error("Assessment error:", error);
    return Response.json(
      { error: "Failed to process assessment" },
      { status: 500 }
    );
  }
}
