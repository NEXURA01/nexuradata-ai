import { generateEstimate } from "../_lib/ai-estimator.js";
import { json, methodNotAllowed, onOptions, parsePayload } from "../_lib/http.js";
import { hasSupabaseServiceKey, supabaseInsert } from "../_lib/supabase.js";

const normalizeText = (value, maxLength) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateEstimateRequest = (payload) => {
  const organization = normalizeText(payload.organization, 160);
  const contactName = normalizeText(payload.contact_name || payload.contactName, 160);
  const email = normalizeText(payload.email, 180).toLowerCase();
  const workflowSummary = normalizeText(payload.workflow_summary || payload.workflowSummary, 4000);

  if (!organization || !contactName || !email || !workflowSummary) {
    throw new Error("Organisation, contact, courriel et résumé opérationnel sont requis.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Adresse courriel invalide.");
  }

  if (workflowSummary.length < 40) {
    throw new Error("Décrivez le flux avec plus de contexte opérationnel.");
  }

  return {
    organization,
    contact_name: contactName,
    email,
    workflow_summary: workflowSummary
  };
};

export const onRequestOptions = (context) => onOptions(context.env, "POST, OPTIONS");

export const onRequestPost = async (context) => {
  if (!context.env?.SUPABASE_URL || !hasSupabaseServiceKey(context.env) || !context.env?.OPENAI_API_KEY) {
    return json({ ok: false, message: "Moteur d'estimation temporairement indisponible." }, { status: 503 });
  }

  try {
    const payload = validateEstimateRequest(await parsePayload(context.request));
    const leadInsert = await supabaseInsert(context.env, "leads", payload);
    const lead = leadInsert?.[0];

    if (!lead?.id) {
      throw new Error("Le lead n'a pas pu être initialisé.");
    }

    const estimate = await generateEstimate(context.env, payload.workflow_summary);
    const estimateInsert = await supabaseInsert(context.env, "ai_estimates", {
      lead_id: lead.id,
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
    });
    const aiEstimate = estimateInsert?.[0] || null;
    const recommendedSolution = Array.isArray(estimate.infrastructure_scope)
      ? estimate.infrastructure_scope.join(", ")
      : "Workflow centralise avec automatisations et dashboard operationnel";
    const workflowCaseInsert = await supabaseInsert(context.env, "workflow_cases", {
      lead_id: lead.id,
      ai_estimate_id: aiEstimate?.id || null,
      organization: payload.organization,
      contact_email: payload.email,
      workflow_summary: payload.workflow_summary,
      recommended_solution: recommendedSolution,
      current_stage: "estimate_generated",
      payment_status: "pending",
      workflow_status: "pending_activation",
      dashboard_status: "not_started",
      metadata: {
        next: "human_validation",
        source: "api_estimate"
      }
    });

    return json({
      ok: true,
      lead,
      estimate: aiEstimate,
      workflow_case: workflowCaseInsert?.[0] || null,
      next: "human_validation"
    });
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      context: "ai_estimate_error",
      error: err.message
    }));

    const status = /requis|invalide|contexte/i.test(err.message) ? 400 : 500;
    return json({ ok: false, message: err.message || "L'estimation n'a pas pu être générée." }, { status });
  }
};

export const onRequest = methodNotAllowed;