import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  guardPublicPost,
  hasFilledHoneypot,
  jsonWithSecurity,
  resetRequestGuardForTests,
} from "../../lib/request-guard.ts";

function makeRequest(headers = {}) {
  return new Request("https://nexuradata.ca/api/contact", { headers });
}

describe("request guard", () => {
  beforeEach(() => {
    resetRequestGuardForTests();
  });

  it("limits requests by endpoint namespace and client IP", () => {
    const request = makeRequest({ "x-forwarded-for": "203.0.113.10" });

    expect(checkRateLimit(request, { namespace: "contact", maxRequests: 2 }).allowed).toBe(true);
    expect(checkRateLimit(request, { namespace: "contact", maxRequests: 2 }).allowed).toBe(true);

    const blocked = checkRateLimit(request, { namespace: "contact", maxRequests: 2 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    expect(checkRateLimit(request, { namespace: "newsletter", maxRequests: 2 }).allowed).toBe(true);
  });

  it("rejects scanner user agents before route work runs", async () => {
    const response = guardPublicPost(
      makeRequest({ "user-agent": "sqlmap/1.7", "x-forwarded-for": "203.0.113.11" }),
      { namespace: "contact", maxRequests: 5 },
    );

    expect(response?.status).toBe(403);
    expect(response?.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await response?.json()).toEqual({ ok: false, error: "forbidden" });
  });

  it("returns 429 with retry-after when the window is exhausted", () => {
    const request = makeRequest({ "x-forwarded-for": "203.0.113.12" });

    expect(guardPublicPost(request, { namespace: "chat", maxRequests: 1 })).toBeNull();
    const response = guardPublicPost(request, { namespace: "chat", maxRequests: 1 });

    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBeTruthy();
    expect(response?.headers.get("cache-control")).toBe("no-store");
  });

  it("detects filled honeypot fields", () => {
    expect(hasFilledHoneypot({ website: "https://spam.example" })).toBe(true);
    expect(hasFilledHoneypot({ website: "" })).toBe(false);
    expect(hasFilledHoneypot({ email: "client@example.com" })).toBe(false);
  });

  it("adds no-store and noindex headers to JSON responses", () => {
    const response = jsonWithSecurity({ ok: true });

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});