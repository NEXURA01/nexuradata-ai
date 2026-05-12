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

const scoreKeys = [
  "workflow_count",
  "integration_count",
  "team_complexity",
  "automation_depth",
  "dashboard_need",
  "ai_need",
  "urgency_risk"
];

const scoreBands = [
  { min: 7, max: 10, scope: "Starter Assessment", minCad: 250, maxCad: 500 },
  { min: 11, max: 15, scope: "Standard / Deep Assessment", minCad: 500, maxCad: 3500 },
  { min: 16, max: 20, scope: "Workflow Automation", minCad: 2000, maxCad: 7500 },
  { min: 21, max: 25, scope: "Cross-Team Workflow / Dashboard", minCad: 7500, maxCad: 20000 },
  { min: 26, max: 30, scope: "Core Operational System", minCad: 15000, maxCad: 50000 },
  { min: 31, max: 35, scope: "Growth / Enterprise Infrastructure", minCad: 50000, maxCad: 250000 }
];

const pricingCategories = [
  "Operational Assessment: Starter Assessment $250-$500 CAD for 1 workflow, 1-2 tools, simple problem; Standard Assessment $500-$1,500 CAD for 2-5 workflows, several tools, basic process mapping; Deep Assessment $1,500-$3,500 CAD for multi-team unclear operations and detailed workflow roadmap.",
  "Workflow Automation: Single Workflow $2,000-$4,000 CAD; Multi-Step Workflow $4,000-$7,500 CAD; Cross-Team Workflow $7,500-$15,000 CAD.",
  "Operational Dashboard: Basic Dashboard $5,000-$8,000 CAD; Live Dashboard $8,000-$15,000 CAD; Command Dashboard $15,000-$30,000 CAD.",
  "Full Operational Infrastructure: Core System $15,000-$30,000 CAD; Growth System $30,000-$75,000 CAD; Enterprise System $75,000-$250,000+ CAD.",
  "Monthly Support after implementation: Maintenance $500-$1,500/month; Optimization $1,500-$5,000/month; Managed Operations Layer $5,000-$15,000+/month."
];

const scoringRules = [
  "workflow_count: 1 workflow=1, 2-3 workflows=2, 4-6 workflows=3, 7-10 workflows=4, 10+ workflows=5.",
  "integration_count: no integration/manual only=1, email or form only=2, 2-3 tools=3, 4-6 tools/APIs=4, 7+ tools/complex APIs=5.",
  "team_complexity: solo/1 owner=1, small team=2, 2-3 teams=3, 4-6 teams=4, multi-department/enterprise=5.",
  "automation_depth: simple notification=1, trigger plus action=2, multi-step automation=3, conditional routing=4, orchestration engine=5.",
  "dashboard_need: none=1, basic status page=2, internal dashboard=3, live dashboard plus alerts=4, command dashboard plus permissions=5.",
  "ai_need: no AI needed=1, AI summary only=2, AI classification=3, AI routing/estimate=4, AI operational intelligence layer=5.",
  "urgency_risk: low urgency=1, normal=2, active inefficiency=3, revenue-impacting=4, critical operations=5."
];

const confidenceMap = {
  low: 0.42,
  medium: 0.64,
  high: 0.84
};

const normalizeList = (value, fallback, maxItems = 8) => {
  const list = Array.isArray(value) ? value : fallback;
  return list
    .map((item) => normalizeText(item, 260))
    .filter(Boolean)
    .slice(0, maxItems);
};

const scoreBandFromTotal = (total) =>
  scoreBands.find((band) => total >= band.min && total <= band.max) || scoreBands[1];

const normalizeConfidence = (value) => {
  const normalized = normalizeText(value, 20).toLowerCase();
  if (["low", "medium", "high"].includes(normalized)) return normalized;
  return "medium";
};

const normalizeCadAmount = (value, fallback) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(250, Math.round(amount));
};

const clientSummaryPrefix = "Based on the information provided, the estimated implementation range is";

const buildClientSummary = (scope, minCad, maxCad) =>
  `${clientSummaryPrefix} $${minCad.toLocaleString("en-CA")}-$${maxCad.toLocaleString("en-CA")} CAD for ${scope.toLowerCase()}, pending human validation.`;

const buildCompatibilityScores = (scores) => ({
  complexity_score: clampNumber(Math.round(((scores.workflow_count + scores.team_complexity + scores.dashboard_need) / 3) * 2), 1, 10, 5),
  orchestration_score: clampNumber(scores.automation_depth * 2, 1, 10, 5),
  integration_score: clampNumber(scores.integration_count * 2, 1, 10, 4),
  urgency_score: clampNumber(scores.urgency_risk * 2, 1, 10, 4)
});

const normalizeScores = (value = {}) => {
  const scores = {};

  for (const key of scoreKeys) {
    scores[key] = clampNumber(value[key], 1, 5, 2);
  }

  scores.total = scoreKeys.reduce((sum, key) => sum + scores[key], 0);
  return scores;
};

const shouldPromoteInfrastructure = (scores) =>
  scores.dashboard_need >= 4 && scores.ai_need >= 4 && scores.integration_count >= 4;

const selectPricingBand = (scores) =>
  shouldPromoteInfrastructure(scores) && scores.total < 26
    ? scoreBands[4]
    : scoreBandFromTotal(scores.total);

const normalizeEstimateRange = (estimate, band) => {
  const proposedMin = normalizeCadAmount(estimate.estimated_min_cad, band.minCad);
  const proposedMax = normalizeCadAmount(estimate.estimated_max_cad, band.maxCad);
  const minCad = Math.max(250, proposedMin);
  const maxCad = Math.max(minCad, proposedMax);

  return {
    estimatedMinCad: minCad,
    estimatedMaxCad: maxCad
  };
};

const normalizeEstimate = (value) => {
  const estimate = value && typeof value === "object" ? value : {};
  const scores = normalizeScores(estimate.scores);
  const band = selectPricingBand(scores);
  const recommendedScope = band.scope;
  const { estimatedMinCad, estimatedMaxCad } = normalizeEstimateRange(estimate, band);
  const confidence = normalizeConfidence(estimate.confidence);
  const reasoning = normalizeList(estimate.reasoning, [
    "The request requires operational scoping before implementation pricing is confirmed.",
    "The estimate is based on workflow count, integrations, team complexity, automation depth, dashboard need, AI need and urgency."
  ]);
  const includedLayers = normalizeList(estimate.included_layers, [
    "Workflow mapping",
    "Operational analysis",
    "Human validation",
    "Next-step roadmap"
  ]);
  const missingInformation = normalizeList(estimate.missing_information, [], 10);
  const proposedSummary = normalizeText(estimate.client_facing_summary, 1200);
  const clientFacingSummary = proposedSummary.startsWith(clientSummaryPrefix) && !/will cost exactly/i.test(proposedSummary)
    ? proposedSummary
    : buildClientSummary(recommendedScope, estimatedMinCad, estimatedMaxCad);
  const compatibilityScores = buildCompatibilityScores(scores);

  return {
    recommended_scope: recommendedScope,
    estimated_min_cad: estimatedMinCad,
    estimated_max_cad: estimatedMaxCad,
    confidence,
    scores,
    reasoning,
    included_layers: includedLayers,
    missing_information: missingInformation,
    human_review_required: true,
    client_facing_summary: clientFacingSummary,
    ...compatibilityScores,
    estimated_min: estimatedMinCad * 100,
    estimated_max: estimatedMaxCad * 100,
    ai_summary: clientFacingSummary,
    infrastructure_scope: {
      recommended_scope: recommendedScope,
      estimated_min_cad: estimatedMinCad,
      estimated_max_cad: estimatedMaxCad,
      confidence,
      scores,
      reasoning,
      included_layers: includedLayers,
      missing_information: missingInformation,
      human_review_required: true,
      client_facing_summary: clientFacingSummary,
      pricing_engine_version: "2026-05-11"
    },
    confidence_score: confidenceMap[confidence]
  };
};

const buildEstimatePromptInput = (payload) => {
  if (typeof payload === "string") {
    return { main_operational_problem: normalizeText(payload, 4000) };
  }

  const input = payload && typeof payload === "object" ? payload : {};
  return {
    company_name: normalizeText(input.organization, 160),
    contact_email: normalizeText(input.email, 180),
    main_operational_problem: normalizeText(input.workflow_summary || input.workflowSummary, 4000),
    current_tools_used: normalizeText(input.current_tools || input.currentTools, 1000),
    workflow_count: normalizeText(input.workflow_count || input.workflowCount, 80),
    teams_involved: normalizeText(input.teams_involved || input.teamsInvolved, 120),
    dashboard_visibility: normalizeText(input.dashboard_visibility || input.dashboardVisibility, 80),
    assisted_analysis_routing: normalizeText(input.ai_routing || input.aiRouting, 80),
    payment_or_client_portal: normalizeText(input.payment_portal || input.paymentPortal, 80),
    urgency: normalizeText(input.urgency, 80),
    budget_expectation: normalizeText(input.budget_expectation || input.budgetExpectation, 120),
    preferred_language: normalizeText(input.preferred_language || input.preferredLanguage, 40)
  };
};

export async function generateEstimate(env, payload) {
  const apiKey = normalizeText(env?.OPENAI_API_KEY, 500);
  const promptInput = buildEstimatePromptInput(payload);
  const summary = promptInput.main_operational_problem;

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
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: [
            "You are Nexura's operational pricing analyst.",
            "Nexura builds AI-powered operational systems, workflow automation, dashboards, and centralized infrastructure for businesses.",
            "Your job is to analyze the client request and produce an estimated operational scope.",
            "Do not give an exact final price. Do not promise delivery. Do not invent information.",
            "If information is missing, lower the confidence and list missing details.",
            "The output is an estimated operational scope, estimated range, confidence level, reason for estimate, and mandatory human validation.",
            "Always use this client-facing language: Based on the information provided, the estimated implementation range is...",
            "Never say: This will cost exactly...",
            "Use these pricing categories when choosing scope:",
            pricingCategories.join(" "),
            "Score each category from 1 to 5: workflow_count, integration_count, team_complexity, automation_depth, dashboard_need, ai_need, urgency_risk.",
            scoringRules.join(" "),
            "Total score determines scope: 7-10 Starter Assessment $250-$500 CAD; 11-15 Standard/Deep Assessment $500-$3,500 CAD; 16-20 Workflow Automation $2,000-$7,500 CAD; 21-25 Cross-Team Workflow or Dashboard $7,500-$20,000 CAD; 26-30 Core Operational System $15,000-$50,000 CAD; 31-35 Growth/Enterprise Infrastructure $50,000-$250,000+ CAD.",
            "If score is high because of dashboard_need plus ai_need plus integrations, push toward Full Operational Infrastructure, not only automation.",
            "Apply modifiers: +10-20% for urgent timeline, messy process ownership, bilingual delivery, legal/privacy requirements; +20-40% for custom portal, role-based access, Stripe/payment system, multiple environments, many integrations; +40-100% for enterprise reliability, regulated data, real-time monitoring, custom AI evaluation engine, advanced analytics; -10-25% for narrow scope, clean APIs, no dashboard, no AI, advisory only.",
            "Stripe is only for assessment payment by default: $250-$1,500 CAD. Larger implementation estimates require human validation, a final proposal, then a Stripe invoice or payment link. Do not auto-charge implementation amounts from the AI estimate.",
            "Return JSON only with: recommended_scope, estimated_min_cad, estimated_max_cad, confidence, scores, reasoning, included_layers, missing_information, human_review_required, client_facing_summary. Confidence must be low, medium, or high. human_review_required must be true."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(promptInput)
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

export { normalizeEstimate, buildEstimatePromptInput };
