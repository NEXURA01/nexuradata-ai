// @ts-ignore Supabase Edge Functions resolve npm: imports at deploy time.
import OpenAI from "npm:openai";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type EstimatePayload = {
  organization: string;
  contact_name: string;
  email: string;
  workflow_summary: string;
  current_tools: string;
  workflow_count: string;
  teams_involved: string;
  dashboard_visibility: string;
  ai_routing: string;
  payment_portal: string;
  urgency: string;
  budget_expectation: string;
  preferred_language: string;
};

type ScoreMap = {
  workflow_count: number;
  integration_count: number;
  team_complexity: number;
  automation_depth: number;
  dashboard_need: number;
  ai_need: number;
  urgency_risk: number;
  total: number;
};

const allowedOrigins = new Set([
  "https://nexuradata.ca",
  "https://www.nexuradata.ca",
  "https://nexuradata-ai.pages.dev",
  "http://localhost:8788",
  "http://localhost:5173",
  "http://127.0.0.1:8788",
  "http://127.0.0.1:5173"
]);

const scoreKeys = [
  "workflow_count",
  "integration_count",
  "team_complexity",
  "automation_depth",
  "dashboard_need",
  "ai_need",
  "urgency_risk"
] as const;

const scoreBands = [
  { min: 7, max: 10, scope: "Starter Assessment", minCad: 250, maxCad: 500 },
  { min: 11, max: 15, scope: "Standard / Deep Assessment", minCad: 500, maxCad: 3500 },
  { min: 16, max: 20, scope: "Workflow Automation", minCad: 2000, maxCad: 7500 },
  { min: 21, max: 25, scope: "Cross-Team Workflow / Dashboard", minCad: 7500, maxCad: 20000 },
  { min: 26, max: 30, scope: "Core Operational System", minCad: 15000, maxCad: 50000 },
  { min: 31, max: 35, scope: "Growth / Enterprise Infrastructure", minCad: 50000, maxCad: 250000 }
];

const pricingCategories = [
  "Operational Assessment: Starter $250-$500 CAD, Standard $500-$1,500 CAD, Deep $1,500-$3,500 CAD.",
  "Workflow Automation: Single Workflow $2,000-$4,000 CAD, Multi-Step $4,000-$7,500 CAD, Cross-Team $7,500-$15,000 CAD.",
  "Operational Dashboard: Basic $5,000-$8,000 CAD, Live $8,000-$15,000 CAD, Command $15,000-$30,000 CAD.",
  "Full Operational Infrastructure: Core $15,000-$30,000 CAD, Growth $30,000-$75,000 CAD, Enterprise $75,000-$250,000+ CAD.",
  "Monthly support after implementation: Maintenance $500-$1,500/month, Optimization $1,500-$5,000/month, Managed Operations Layer $5,000-$15,000+/month."
];

const confidenceMap: Record<string, number> = {
  low: 0.42,
  medium: 0.64,
  high: 0.84
};

const corsHeaders = (request: Request) => {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : "https://nexuradata.ca";

  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    vary: "Origin"
  };
};

const json = (request: Request, payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...corsHeaders(request),
      ...(init.headers || {})
    }
  });

const normalizeText = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const normalizeCadAmount = (value: unknown, fallback: number) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(250, Math.round(amount));
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validatePayload = (input: Record<string, unknown>): EstimatePayload => {
  const payload = {
    organization: normalizeText(input.organization || input.company, 160),
    contact_name: normalizeText(input.contact_name || input.contactName || input.name, 160),
    email: normalizeText(input.email, 180).toLowerCase(),
    workflow_summary: normalizeText(input.workflow_summary || input.workflowSummary || input.problem, 4000),
    current_tools: normalizeText(input.current_tools || input.currentTools || input.tools, 1000),
    workflow_count: normalizeText(input.workflow_count || input.workflowCount, 80),
    teams_involved: normalizeText(input.teams_involved || input.teamsInvolved || input.teams, 120),
    dashboard_visibility: normalizeText(input.dashboard_visibility || input.dashboardVisibility, 80),
    ai_routing: normalizeText(input.ai_routing || input.aiRouting, 80),
    payment_portal: normalizeText(input.payment_portal || input.paymentPortal, 80),
    urgency: normalizeText(input.urgency, 80),
    budget_expectation: normalizeText(input.budget_expectation || input.budgetExpectation, 120),
    preferred_language: normalizeText(input.preferred_language || input.preferredLanguage, 40)
  };

  const required = [
    payload.organization,
    payload.contact_name,
    payload.email,
    payload.workflow_summary,
    payload.current_tools,
    payload.workflow_count,
    payload.teams_involved,
    payload.dashboard_visibility,
    payload.ai_routing,
    payload.payment_portal,
    payload.urgency,
    payload.preferred_language
  ];

  if (required.some((value) => !value)) {
    throw new Error("Organization, contact, email, problem, tools, workflows, teams, visibility, AI routing, portal, urgency and language are required.");
  }

  if (!isValidEmail(payload.email)) {
    throw new Error("Invalid email address.");
  }

  if (payload.workflow_summary.length < 40) {
    throw new Error("Add more operational context before generating the estimate.");
  }

  return payload;
};

const normalizeScores = (value: Record<string, unknown> = {}) => {
  const scores = {} as ScoreMap;
  let total = 0;

  for (const key of scoreKeys) {
    scores[key] = clampNumber(value[key], 1, 5, 2);
    total += scores[key];
  }

  scores.total = total;
  return scores;
};

const scoreBandFromTotal = (total: number) =>
  scoreBands.find((band) => total >= band.min && total <= band.max) || scoreBands[1];

const selectPricingBand = (scores: ScoreMap) =>
  scores.dashboard_need >= 4 && scores.ai_need >= 4 && scores.integration_count >= 4 && scores.total < 26
    ? scoreBands[4]
    : scoreBandFromTotal(scores.total);

const normalizeList = (value: unknown, fallback: string[], maxItems = 8) => {
  const list = Array.isArray(value) ? value : fallback;
  return list
    .map((item) => normalizeText(item, 260))
    .filter(Boolean)
    .slice(0, maxItems);
};

const normalizeConfidence = (value: unknown) => {
  const confidence = normalizeText(value, 20).toLowerCase();
  return ["low", "medium", "high"].includes(confidence) ? confidence : "medium";
};

const buildClientSummary = (scope: string, minCad: number, maxCad: number) =>
  `Based on the information provided, the estimated implementation range is $${minCad.toLocaleString("en-CA")}-$${maxCad.toLocaleString("en-CA")} CAD for ${scope.toLowerCase()}, pending human validation.`;

const buildCompatibilityScores = (scores: ScoreMap) => ({
  complexity_score: clampNumber(Math.round(((scores.workflow_count + scores.team_complexity + scores.dashboard_need) / 3) * 2), 1, 10, 5),
  orchestration_score: clampNumber(scores.automation_depth * 2, 1, 10, 5),
  integration_score: clampNumber(scores.integration_count * 2, 1, 10, 4),
  urgency_score: clampNumber(scores.urgency_risk * 2, 1, 10, 4)
});

const getComplexityLabel = (total: number) => {
  if (total >= 26) return "High";
  if (total >= 16) return "Medium";
  return "Low";
};

const normalizeEstimate = (raw: Record<string, unknown>) => {
  const scores = normalizeScores(raw.scores as Record<string, unknown>);
  const band = selectPricingBand(scores);
  const recommendedScope = normalizeText(raw.recommended_scope, 160) || band.scope;
  const estimatedMinCad = normalizeCadAmount(raw.estimated_min_cad, band.minCad);
  const estimatedMaxCad = Math.max(estimatedMinCad, normalizeCadAmount(raw.estimated_max_cad, band.maxCad));
  const confidence = normalizeConfidence(raw.confidence);
  const proposedSummary = normalizeText(raw.client_facing_summary, 1200);
  const clientFacingSummary = proposedSummary.startsWith("Based on the information provided") && !/will cost exactly/i.test(proposedSummary)
    ? proposedSummary
    : buildClientSummary(recommendedScope, estimatedMinCad, estimatedMaxCad);
  const compatibilityScores = buildCompatibilityScores(scores);

  return {
    complexity: getComplexityLabel(scores.total),
    recommended_scope: recommendedScope,
    estimated_min_cad: estimatedMinCad,
    estimated_max_cad: estimatedMaxCad,
    confidence,
    scores,
    reasoning: normalizeList(raw.reasoning, [
      "The request requires operational scoping before implementation pricing is confirmed.",
      "The estimate is based on workflow count, integrations, team complexity, automation depth, dashboard need, AI need and urgency."
    ]),
    included_layers: normalizeList(raw.included_layers, [
      "Workflow mapping",
      "Operational analysis",
      "Human validation",
      "Next-step roadmap"
    ]),
    missing_information: normalizeList(raw.missing_information, [], 10),
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
      human_review_required: true,
      client_facing_summary: clientFacingSummary,
      pricing_engine_version: "2026-05-12-supabase-edge"
    },
    confidence_score: confidenceMap[confidence]
  };
};

const buildPromptInput = (payload: EstimatePayload) => ({
  company_name: payload.organization,
  contact_email: payload.email,
  main_operational_problem: payload.workflow_summary,
  current_tools_used: payload.current_tools,
  workflow_count: payload.workflow_count,
  teams_involved: payload.teams_involved,
  dashboard_visibility: payload.dashboard_visibility,
  assisted_analysis_routing: payload.ai_routing,
  payment_or_client_portal: payload.payment_portal,
  urgency: payload.urgency,
  budget_expectation: payload.budget_expectation,
  preferred_language: payload.preferred_language
});

const buildLeadSummary = (payload: EstimatePayload) => [
  payload.workflow_summary,
  "",
  `Current tools: ${payload.current_tools}`,
  `Workflow count: ${payload.workflow_count}`,
  `Teams involved: ${payload.teams_involved}`,
  `Dashboard visibility: ${payload.dashboard_visibility}`,
  `AI routing: ${payload.ai_routing}`,
  `Payment portal: ${payload.payment_portal}`,
  `Urgency: ${payload.urgency}`,
  payload.budget_expectation ? `Budget expectation: ${payload.budget_expectation}` : "Budget expectation: not specified",
  `Preferred language: ${payload.preferred_language}`
].join("\n");

const parseSupabaseResponse = async (response: Response) => {
  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message?: unknown }).message)
      : text || `Supabase error ${response.status}.`;
    throw new Error(message);
  }

  return data as Record<string, unknown>[];
};

const supabaseInsert = async (table: string, body: Record<string, unknown>) => {
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    throw new Error("Invalid Supabase table.");
  }

  const supabaseUrl = normalizeText(Deno.env.get("SUPABASE_URL"), 300).replace(/\/+$/, "");
  const serviceRoleKey = normalizeText(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY"), 1400);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service credentials are not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(body)
  });

  return parseSupabaseResponse(response);
};

const generateEstimate = async (payload: EstimatePayload) => {
  const apiKey = normalizeText(Deno.env.get("OPENAI_API_KEY"), 800);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Supabase Edge Function secrets.");
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: Deno.env.get("OPENAI_ESTIMATE_MODEL") || "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 900,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are Nexura's operational assessment AI.",
          "Analyze the client request and return a cautious implementation estimate.",
          "Do not give an exact final price. Human validation is always required.",
          "Use these pricing categories:",
          pricingCategories.join(" "),
          "Return JSON only with: recommended_scope, estimated_min_cad, estimated_max_cad, confidence, scores, reasoning, included_layers, missing_information, human_review_required, client_facing_summary.",
          "scores must include integers from 1 to 5 for workflow_count, integration_count, team_complexity, automation_depth, dashboard_need, ai_need and urgency_risk.",
          "confidence must be low, medium or high. human_review_required must be true."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(buildPromptInput(payload))
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty estimate.");
  }

  return normalizeEstimate(JSON.parse(content));
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== "POST") {
    return json(request, { ok: false, message: "Method not allowed." }, { status: 405 });
  }

  try {
    const input = await request.json() as Record<string, unknown>;
    const payload = validatePayload(input);
    const estimate = await generateEstimate(payload);
    const leadPayload = {
      company: payload.organization,
      name: payload.contact_name,
      problem: payload.workflow_summary,
      tools: payload.current_tools,
      teams: payload.teams_involved,
      organization: payload.organization,
      contact_name: payload.contact_name,
      email: payload.email,
      workflow_summary: buildLeadSummary(payload),
      status: "estimated"
    };
    const lead = (await supabaseInsert("leads", leadPayload))[0];

    if (!lead?.id) {
      throw new Error("The lead could not be initialized.");
    }

    const aiEstimate = (await supabaseInsert("ai_estimates", {
      lead_id: lead.id,
      complexity: estimate.complexity,
      recommended_scope: estimate.recommended_scope,
      estimated_min_cad: estimate.estimated_min_cad,
      estimated_max_cad: estimate.estimated_max_cad,
      summary: estimate.client_facing_summary,
      raw_result: estimate,
      complexity_score: estimate.complexity_score,
      orchestration_score: estimate.orchestration_score,
      integration_score: estimate.integration_score,
      urgency_score: estimate.urgency_score,
      estimated_min: estimate.estimated_min,
      estimated_max: estimate.estimated_max,
      ai_summary: estimate.ai_summary,
      infrastructure_scope: estimate.infrastructure_scope,
      confidence_score: estimate.confidence_score,
      final_status: "draft"
    }))[0] || null;

    return json(request, {
      ok: true,
      lead,
      estimate: {
        ...(aiEstimate || {}),
        ...estimate,
        id: aiEstimate?.id || null
      },
      next: "human_validation"
    });
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "supabase_edge_estimate_error",
      error: error instanceof Error ? error.message : String(error)
    }));

    const message = error instanceof Error ? error.message : "The estimate could not be generated.";
    const status = /required|invalid|context|email/i.test(message) ? 400 : 500;
    return json(request, { ok: false, message }, { status });
  }
});