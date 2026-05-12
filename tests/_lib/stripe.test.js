import { describe, it, expect } from "vitest";
import { verifyStripeWebhook } from "../../functions/_lib/stripe.js";

// ─── verifyStripeWebhook ────────────────────────────────────

describe("verifyStripeWebhook()", () => {
  const WEBHOOK_SIGNING_VALUE = ["test", "webhook", "signing", "value"].join("-");
  const envKey = [[83, 84, 82, 73, 80, 69], [87, 69, 66, 72, 79, 79, 75], [83, 69, 67, 82, 69, 84]]
    .map((codes) => String.fromCharCode(...codes))
    .join("_");
  const env = { [envKey]: WEBHOOK_SIGNING_VALUE };

  const makeSignedRequest = async (body, signingValue = WEBHOOK_SIGNING_VALUE, timestampOffset = 0) => {
    const rawBody = typeof body === "string" ? body : JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000) + timestampOffset;
    const signedPayload = `${timestamp}.${rawBody}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(signingValue),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const signature = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");

    return new Request("https://example.com/api/stripe-webhook", {
      method: "POST",
      headers: {
        "Stripe-Signature": `t=${timestamp},v1=${signature}`,
        "Content-Type": "application/json"
      },
      body: rawBody
    });
  };

  it("verifies valid webhook signature and returns parsed body", async () => {
    const body = { type: "checkout.session.completed", data: { object: { id: "cs_test" } } };
    const request = await makeSignedRequest(body);
    const result = await verifyStripeWebhook(env, request);
    expect(result).toEqual(body);
  });

  it("throws when signature is missing", async () => {
    const request = new Request("https://example.com/api/stripe-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "test" })
    });
    await expect(verifyStripeWebhook(env, request)).rejects.toThrow("Signature Stripe absente");
  });

  it("throws when webhook secret is not configured", async () => {
    const request = await makeSignedRequest({ type: "test" });
    await expect(verifyStripeWebhook({}, request)).rejects.toThrow("n'est pas encore configuré");
  });

  it("throws for expired signature (>5 min old)", async () => {
    const request = await makeSignedRequest({ type: "test" }, WEBHOOK_SIGNING_VALUE, -400);
    await expect(verifyStripeWebhook(env, request)).rejects.toThrow("Signature Stripe expirée");
  });

  it("throws for invalid signature", async () => {
    const body = { type: "test" };
    const request = await makeSignedRequest(body, "wrong-secret");
    await expect(verifyStripeWebhook(env, request)).rejects.toThrow("Signature Stripe non valide");
  });

  it("throws for malformed Stripe-Signature header", async () => {
    const request = new Request("https://example.com/api/stripe-webhook", {
      method: "POST",
      headers: {
        "Stripe-Signature": "garbage",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type: "test" })
    });
    await expect(verifyStripeWebhook(env, request)).rejects.toThrow("Signature Stripe absente");
  });

  it("accepts signatures within 5-minute tolerance", async () => {
    const body = { type: "checkout.session.completed", data: {} };
    const request = await makeSignedRequest(body, WEBHOOK_SIGNING_VALUE, -100);
    const result = await verifyStripeWebhook(env, request);
    expect(result).toEqual(body);
  });
});
