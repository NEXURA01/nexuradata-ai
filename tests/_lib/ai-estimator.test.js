import { describe, expect, it } from "vitest";
import { buildEstimatePromptInput, normalizeEstimate } from "../../functions/_lib/ai-estimator.js";

describe("AI pricing estimator", () => {
  it("maps total scores to the operational scope table", () => {
    const estimate = normalizeEstimate({
      scores: {
        workflow_count: 3,
        integration_count: 3,
        team_complexity: 3,
        automation_depth: 3,
        dashboard_need: 3,
        ai_need: 3,
        urgency_risk: 3
      }
    });

    expect(estimate.scores.total).toBe(21);
    expect(estimate.recommended_scope).toBe("Cross-Team Workflow / Dashboard");
    expect(estimate.estimated_min_cad).toBe(7500);
    expect(estimate.estimated_max_cad).toBe(20000);
    expect(estimate.estimated_min).toBe(750000);
    expect(estimate.human_review_required).toBe(true);
    expect(estimate.client_facing_summary).toMatch(/^Based on the information provided, the estimated implementation range is/);
  });

  it("promotes dashboard, analysis and integration-heavy work toward infrastructure", () => {
    const estimate = normalizeEstimate({
      scores: {
        workflow_count: 2,
        integration_count: 4,
        team_complexity: 3,
        automation_depth: 3,
        dashboard_need: 4,
        ai_need: 4,
        urgency_risk: 3
      }
    });

    expect(estimate.scores.total).toBe(23);
    expect(estimate.recommended_scope).toBe("Core Operational System");
    expect(estimate.estimated_min_cad).toBe(15000);
    expect(estimate.estimated_max_cad).toBe(50000);
  });

  it("derives scope from the score band instead of accepting mismatched AI labels", () => {
    const estimate = normalizeEstimate({
      recommended_scope: "This will cost exactly a dashboard",
      estimated_min_cad: 7500,
      estimated_max_cad: 15000,
      scores: {
        workflow_count: 3,
        integration_count: 4,
        team_complexity: 3,
        automation_depth: 4,
        dashboard_need: 3,
        ai_need: 3,
        urgency_risk: 3
      }
    });

    expect(estimate.scores.total).toBe(23);
    expect(estimate.recommended_scope).toBe("Cross-Team Workflow / Dashboard");
    expect(estimate.client_facing_summary).toContain("$7,500-$15,000 CAD");
  });

  it("rejects fixed-price language in the client-facing summary", () => {
    const estimate = normalizeEstimate({
      client_facing_summary: "This will cost exactly $20,000 CAD.",
      scores: {
        workflow_count: 2,
        integration_count: 2,
        team_complexity: 2,
        automation_depth: 2,
        dashboard_need: 2,
        ai_need: 2,
        urgency_risk: 2
      }
    });

    expect(estimate.client_facing_summary).toMatch(/^Based on the information provided, the estimated implementation range is/);
    expect(estimate.client_facing_summary).not.toMatch(/exactly/i);
  });

  it("builds prompt input from the public estimate form contract", () => {
    const promptInput = buildEstimatePromptInput({
      organization: "NEXURA",
      email: "ops@example.com",
      workflow_summary: "Requests are scattered between email, Slack and the CRM.",
      current_tools: "Slack, HubSpot, Gmail",
      workflow_count: "4-6 workflows",
      teams_involved: "2-3 teams",
      dashboard_visibility: "Live dashboard with alerts",
      ai_routing: "Assisted routing or estimate",
      payment_portal: "Portal with payments and statuses",
      urgency: "Revenue-impacting",
      budget_expectation: "$10k-$20k",
      preferred_language: "Bilingual FR / EN"
    });

    expect(promptInput).toEqual({
      company_name: "NEXURA",
      contact_email: "ops@example.com",
      main_operational_problem: "Requests are scattered between email, Slack and the CRM.",
      current_tools_used: "Slack, HubSpot, Gmail",
      workflow_count: "4-6 workflows",
      teams_involved: "2-3 teams",
      dashboard_visibility: "Live dashboard with alerts",
      assisted_analysis_routing: "Assisted routing or estimate",
      payment_or_client_portal: "Portal with payments and statuses",
      urgency: "Revenue-impacting",
      budget_expectation: "$10k-$20k",
      preferred_language: "Bilingual FR / EN"
    });
  });
});
