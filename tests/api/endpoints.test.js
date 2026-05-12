import { describe, it, expect } from "vitest";
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
    const env = { DATABASE_URL: "postgresql://test", STRIPE_WEBHOOK_SECRET: "whsec_test" };
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
});
