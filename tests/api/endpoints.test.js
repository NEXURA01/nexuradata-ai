import { createHmac } from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { onRequestPost as intakeHandler, onRequestOptions as intakeOptions } from "../../functions/api/intake.js";
import { onRequestPost as statusHandler, onRequestOptions as statusOptions, onRequest as statusFallback } from "../../functions/api/status.js";
import { onRequestPost as authorizationHandler, onRequestOptions as authorizationOptions, onRequest as authorizationFallback } from "../../functions/api/authorization.js";
import { onRequestPost as estimateHandler, onRequestOptions as estimateOptions, onRequest as estimateFallback } from "../../functions/api/estimate.js";
import { onRequestPost as activationCheckoutHandler, onRequestOptions as activationCheckoutOptions, onRequest as activationCheckoutFallback } from "../../functions/api/create-checkout.js";
import { onRequestPost as checkoutHandler, onRequestOptions as checkoutOptions, onRequest as checkoutFallback } from "../../functions/api/create-checkout-session.js";
import { onRequestPost as webhookHandler } from "../../functions/api/stripe-webhook.js";

// ─── Helpers ────────────────────────────────────────────────

const makeContext = (body, env = {}, method = "POST") => ({
  request: new Request("https://nexuradata.ca/api/intake", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }),
  env
});

const stripeWebhookTestSecret = ["whsec", "test"].join("_");

// ─── intake endpoint ────────────────────────────────────────

describe("POST /api/intake", () => {
  it("returns 503 when DATABASE_URL is not configured", async () => {
    const ctx = makeContext({}, {});
    const res = await intakeHandler(ctx);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.fallback).toBe("mailto");
  });

  it("returns 503 when ACCESS_CODE_SECRET is missing", async () => {
    const ctx = makeContext({}, { DATABASE_URL: "postgresql://test" });
    const res = await intakeHandler(ctx);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 400 for invalid submission (missing fields)", async () => {
    const env = { DATABASE_URL: "postgresql://test", ACCESS_CODE_SECRET: "test-secret" };
    const ctx = makeContext({ nom: "" }, env);
    const res = await intakeHandler(ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("OPTIONS handler returns 204", () => {
    const res = intakeOptions({ env: {} });
    expect(res.status).toBe(204);
  });
});

// ─── status endpoint ────────────────────────────────────────

describe("POST /api/status", () => {
  it("returns 503 when DATABASE_URL is not configured", async () => {
    const ctx = makeContext({}, {});
    ctx.request = new Request("https://nexuradata.ca/api/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await statusHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("returns 503 for missing credentials", async () => {
    const env = { DATABASE_URL: "postgresql://test" };
    const ctx = makeContext({}, env);
    ctx.request = new Request("https://nexuradata.ca/api/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await statusHandler(ctx);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("OPTIONS handler returns 204", () => {
    const res = statusOptions({ env: {} });
    expect(res.status).toBe(204);
  });

  it("fallback handler returns 405", async () => {
    const res = statusFallback();
    expect(res.status).toBe(405);
  });
});

// ─── authorization endpoint ────────────────────────────────

describe("POST /api/authorization", () => {
  it("returns 503 when DATABASE_URL is not configured", async () => {
    const ctx = makeContext({}, {});
    ctx.request = new Request("https://nexuradata.ca/api/authorization", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await authorizationHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("returns 503 when ACCESS_CODE_SECRET is missing", async () => {
    const ctx = makeContext({}, { DATABASE_URL: "postgresql://test" });
    ctx.request = new Request("https://nexuradata.ca/api/authorization", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await authorizationHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("OPTIONS handler returns 204", () => {
    const res = authorizationOptions({ env: {} });
    expect(res.status).toBe(204);
  });

  it("fallback handler returns 405", async () => {
    const res = authorizationFallback();
    expect(res.status).toBe(405);
  });
});

// ─── operational checkout endpoint ─────────────────────────

describe("POST /api/create-checkout-session", () => {
  it("returns 503 when Stripe or database config is missing", async () => {
    const ctx = makeContext({}, { DATABASE_URL: "postgresql://test" });
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await checkoutHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("rejects invalid customer email before creating a Stripe session", async () => {
    const ctx = makeContext({ email: "not-an-email" }, { DATABASE_URL: "postgresql://test", STRIPE_SECRET_KEY: "sk_test" });
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" })
    });
    const res = await checkoutHandler(ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("OPTIONS handler returns 204", () => {
    const res = checkoutOptions({ env: {} });
    expect(res.status).toBe(204);
  });

  it("fallback handler returns 405", async () => {
    const res = checkoutFallback();
    expect(res.status).toBe(405);
  });
});

// ─── AI estimate endpoint ──────────────────────────────────

describe("POST /api/estimate", () => {
  it("returns 503 when Supabase or OpenAI config is missing", async () => {
    const ctx = makeContext({}, { SUPABASE_URL: "https://project.supabase.co" });
    ctx.request = new Request("https://nexuradata.ca/api/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await estimateHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("rejects invalid estimate payload before external calls", async () => {
    const env = {
      SUPABASE_URL: "https://project.supabase.co",
      SUBABASE_SECRET_KEY: "service-role",
      OPENAI_API_KEY: "openai-key"
    };
    const ctx = makeContext({ organization: "NEXURA" }, env);
    ctx.request = new Request("https://nexuradata.ca/api/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organization: "NEXURA" })
    });
    const res = await estimateHandler(ctx);
    expect(res.status).toBe(400);
  });

  it("sends team and client report emails for a generated automation estimate", async () => {
    const payload = {
      organization: "NEXURA Client",
      contact_name: "Marie",
      email: "marie@test.com",
      workflow_summary: "The client needs to centralize operational requests, route approvals, and expose status across teams.",
      current_tools: "Email, spreadsheets, Stripe",
      workflow_count: "3 workflows",
      teams_involved: "Operations and finance",
      dashboard_visibility: "Internal dashboard needed",
      ai_routing: "AI summary and routing needed",
      payment_portal: "Stripe payment review",
      urgency: "This month",
      budget_expectation: "Initial review first",
      preferred_language: "fr"
    };
    const estimateContent = {
      recommended_scope: "Workflow centralise",
      estimated_min_cad: 1500,
      estimated_max_cad: 3000,
      confidence: "medium",
      scores: {
        workflow_count: 2,
        integration_count: 3,
        team_complexity: 3,
        automation_depth: 3,
        dashboard_need: 3,
        ai_need: 3,
        urgency_risk: 2
      },
      reasoning: ["Several team approvals need to be centralized."],
      included_layers: ["Workflow mapping", "Human validation"],
      missing_information: ["Exact systems to integrate"],
      human_review_required: true,
      client_facing_summary: "Based on the information provided, the estimated implementation range is $1,500-$3,000 CAD for workflow centralise, pending human validation."
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options = {}) => {
      const requestUrl = `${url}`;

      if (requestUrl === "https://api.openai.com/v1/chat/completions") {
        return Response.json({ choices: [{ message: { content: JSON.stringify(estimateContent) } }] });
      }

      if (requestUrl.includes("/rest/v1/leads")) {
        return Response.json([{ id: "lead-1", ...JSON.parse(options.body) }]);
      }

      if (requestUrl.includes("/rest/v1/ai_estimates")) {
        return Response.json([{ id: "estimate-1", ...JSON.parse(options.body) }]);
      }

      if (requestUrl.includes("/rest/v1/workflow_cases")) {
        return Response.json([{ id: "workflow-1", ...JSON.parse(options.body) }]);
      }

      if (requestUrl === "https://api.resend.com/emails") {
        return Response.json({ id: crypto.randomUUID() });
      }

      return Response.json([]);
    });

    try {
      const ctx = makeContext(payload, {
        SUPABASE_URL: "https://project.supabase.co",
        SUBABASE_SECRET_KEY: "service-role",
        OPENAI_API_KEY: "openai-key",
        RESEND_API_KEY: "re_test_key",
        RESEND_FROM_EMAIL: "NEXURA <dossiers@nexuradata.ca>",
        TEAM_INBOX_EMAILS: "ops@test.com"
      });
      ctx.request = new Request("https://nexuradata.ca/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const res = await estimateHandler(ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.delivery.team).toBe("sent");
      expect(body.delivery.client_report).toBe("sent");

      const resendCalls = fetchMock.mock.calls.filter(([url]) => `${url}` === "https://api.resend.com/emails");
      expect(resendCalls).toHaveLength(2);
      const resendBodies = resendCalls.map(([, options]) => JSON.parse(options.body));
      expect(resendBodies.some((message) => message.to.includes("ops@test.com"))).toBe(true);
      const clientMessage = resendBodies.find((message) => message.to.includes("marie@test.com"));
      expect(clientMessage.subject).toContain("Rapport d'évaluation opérationnelle");
      expect(clientMessage.text).toContain("RAPPORT INDICATIF");
      expect(clientMessage.text).toMatch(/validation humaine|human validation/i);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("OPTIONS handler returns 204", () => {
    const res = estimateOptions({ env: {} });
    expect(res.status).toBe(204);
  });

  it("fallback handler returns 405", async () => {
    const res = estimateFallback();
    expect(res.status).toBe(405);
  });
});

// ─── activation checkout endpoint ──────────────────────────

describe("POST /api/create-checkout", () => {
  it("returns 503 when Stripe or Supabase config is missing", async () => {
    const ctx = makeContext({}, { STRIPE_SECRET_KEY: "sk_test" });
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 75000 })
    });
    const res = await activationCheckoutHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("rejects invalid amount before creating checkout", async () => {
    const env = {
      SUPABASE_URL: "https://project.supabase.co",
      SUBABASE_SECRET_KEY: "service-role",
      STRIPE_SECRET_KEY: "sk_test"
    };
    const ctx = makeContext({ amount: -10 }, env);
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -10 })
    });
    const res = await activationCheckoutHandler(ctx);
    expect(res.status).toBe(400);
  });

  it("requires a saved estimate before creating checkout", async () => {
    const env = {
      SUPABASE_URL: "https://project.supabase.co",
      SUBABASE_SECRET_KEY: "service-role",
      STRIPE_SECRET_KEY: "sk_test"
    };
    const ctx = makeContext({}, env);
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await activationCheckoutHandler(ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("rejects implementation-sized checkout amounts before creating Stripe sessions", async () => {
    const env = {
      SUPABASE_URL: "https://project.supabase.co",
      SUBABASE_SECRET_KEY: "service-role",
      STRIPE_SECRET_KEY: "sk_test"
    };
    const ctx = makeContext({ amount: 2000000 }, env);
    ctx.request = new Request("https://nexuradata.ca/api/create-checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 2000000 })
    });
    const res = await activationCheckoutHandler(ctx);
    expect(res.status).toBe(400);
  });

  it("OPTIONS handler returns 204", () => {
    const res = activationCheckoutOptions({ env: {} });
    expect(res.status).toBe(204);
  });

  it("fallback handler returns 405", async () => {
    const res = activationCheckoutFallback();
    expect(res.status).toBe(405);
  });
});

// ─── stripe webhook endpoint ────────────────────────────────

describe("POST /api/stripe-webhook", () => {
  it("returns 503 when DATABASE_URL is not configured", async () => {
    const ctx = makeContext({}, {});
    ctx.request = new Request("https://nexuradata.ca/api/stripe-webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const res = await webhookHandler(ctx);
    expect(res.status).toBe(503);
  });

  it("returns 400 when signature verification fails", async () => {
    const env = { DATABASE_URL: "postgresql://test", STRIPE_WEBHOOK_SECRET: stripeWebhookTestSecret };
    const ctx = {
      request: new Request("https://nexuradata.ca/api/stripe-webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Stripe-Signature": "t=12345,v1=badsig"
        },
        body: JSON.stringify({ type: "checkout.session.completed" })
      }),
      env
    };
    const res = await webhookHandler(ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("syncs operational payments and workflow status from a valid checkout event", async () => {
    const secret = stripeWebhookTestSecret;
    const timestamp = Math.floor(Date.now() / 1000);
    const eventBody = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          object: "checkout.session",
          amount_total: 25000,
          customer_details: { email: "Client@Example.com" }
        }
      }
    });
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${eventBody}`)
      .digest("hex");
    const paymentRow = {
      id: "payment-id",
      lead_id: "00000000-0000-0000-0000-000000000001",
      ai_estimate_id: "00000000-0000-0000-0000-000000000002",
      workflow_case_id: "00000000-0000-0000-0000-000000000003",
      payment_request_id: "PAY-TEST",
      stripe_session_id: "cs_test_123",
      customer_email: "client@example.com",
      metadata: {}
    };
    const workflowCase = {
      id: paymentRow.workflow_case_id,
      lead_id: paymentRow.lead_id
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options = {}) => {
      const requestUrl = `${url}`;
      const method = options.method || "GET";

      if (requestUrl.includes("/rest/v1/payments?") && method === "PATCH") {
        expect(JSON.parse(options.body).customer_email).toBe("client@example.com");
        return Response.json([paymentRow]);
      }

      if (requestUrl.includes("/rest/v1/leads?")) {
        return Response.json([{ id: paymentRow.lead_id, organization: "NEXURA", email: "client@example.com", workflow_summary: "Workflow" }]);
      }

      if (requestUrl.includes("/rest/v1/ai_estimates?")) {
        return Response.json([{ id: paymentRow.ai_estimate_id, recommended_scope: "Operational review" }]);
      }

      if (requestUrl.includes("/rest/v1/workflow_cases?") && method === "GET") {
        return Response.json([workflowCase]);
      }

      if (requestUrl.includes("/rest/v1/workflow_cases?") && method === "PATCH") {
        return Response.json([{ ...workflowCase, current_stage: "human_review_pending" }]);
      }

      if (requestUrl.includes("/rest/v1/workflow_events")) {
        return Response.json([{ id: crypto.randomUUID() }]);
      }

      return Response.json([]);
    });

    try {
      const ctx = {
        request: new Request("https://nexuradata.ca/api/stripe-webhook", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Stripe-Signature": `t=${timestamp},v1=${signature}`
          },
          body: eventBody
        }),
        env: {
          SUPABASE_URL: "https://project.supabase.co",
          SUBABASE_SECRET_KEY: "service-role",
          STRIPE_WEBHOOK_SECRET: secret
        }
      };
      const res = await webhookHandler(ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.stripePaymentId).toBe(paymentRow.id);
      expect(body.workflowCaseId).toBe(workflowCase.id);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
