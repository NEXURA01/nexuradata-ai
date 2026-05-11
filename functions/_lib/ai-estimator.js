const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
};

const normalizeText = (value, maxLength) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
};

const normalizeEstimate = (value) => {
  const estimate = value && typeof value === "object" ? value : {};
  const estimatedMin = clampNumber(estimate.estimated_min, 75000, 5000000, 800000);
  const estimatedMax = clampNumber(estimate.estimated_max, estimatedMin, 7500000, Math.max(estimatedMin, 1400000));
  const scope = estimate.infrastructure_scope && typeof estimate.infrastructure_scope === "object"
    ? estimate.infrastructure_scope
    : {
      layer: "Centralized operational workflow system",
      components: ["intake", "routing", "dashboard", "activation"],
      validation: "human review required"
    };

  return {
    complexity_score: clampNumber(estimate.complexity_score, 1, 10, 5),
    orchestration_score: clampNumber(estimate.orchestration_score, 1, 10, 5),
    integration_score: clampNumber(estimate.integration_score, 1, 10, 4),
    urgency_score: clampNumber(estimate.urgency_score, 1, 10, 4),
    estimated_min: estimatedMin,
    estimated_max: estimatedMax,
    ai_summary: normalizeText(
      estimate.ai_summary || "Initial workflow scope requires human validation before activation.",
      1200
    ),
    infrastructure_scope: scope,
    confidence_score: Math.min(1, Math.max(0, Number(estimate.confidence_score) || 0.62))
  };
};

export async function generateEstimate(env, workflowSummary) {
  const apiKey = normalizeText(env?.OPENAI_API_KEY, 500);
  const summary = normalizeText(workflowSummary, 4000);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY n'est pas encore configuré.");
  }

  if (!summary) {
    throw new Error("Résumé opérationnel requis.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: env?.OPENAI_ESTIMATE_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "You are an operational workflow estimation engine for NEXURA.",
            "Analyze workflow complexity, automation potential, integration surface, dashboard needs, and urgency.",
            "Return JSON only with these keys: complexity_score, orchestration_score, integration_score, urgency_score, estimated_min, estimated_max, ai_summary, infrastructure_scope, confidence_score.",
            "Scores are 1-10. Amounts are integer CAD cents. Keep estimates sober and require human validation."
          ].join(" ")
        },
        {
          role: "user",
          content: summary
        }
      ]
    })
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || text || `Erreur OpenAI ${response.status}.`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Réponse d'estimation vide.");
  }

  return normalizeEstimate(JSON.parse(content));
}

export { normalizeEstimate };