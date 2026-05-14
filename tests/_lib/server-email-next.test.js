import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendClientPaymentLinkEmail,
  sendClientLeadMagnetEmail,
  sendTeamLeadMagnetEmail,
} from "../../lib/server-email.ts";

const resendOk = () =>
  new Response(JSON.stringify({ id: "email-id-123" }), { status: 200 });

describe("Next server email lead generation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "NEXURA <noreply@nexuradata.ca>";
    process.env.TEAM_INBOX_EMAILS = "dany@nexuradata.ca olivier@nexuradata.ca contact@nexuradata.ca";
    process.env.NEXT_PUBLIC_BASE_URL = "https://nexuradata.ca";
  });

  it("notifies every team inbox for a lead magnet capture", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(resendOk());

    const result = await sendTeamLeadMagnetEmail(
      {
        email: "lead@example.com",
        company: "Example Co",
        role: "Operations",
        bottleneck: "Manual follow-up between sales and delivery",
        locale: "en",
        sourcePath: "/en/operational-assessment",
        sourceLabel: "footer_notes",
        utmSource: "google",
      },
      undefined,
      "lead-capture-1",
    );

    expect(result.sent).toBe(true);
    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["dany@nexuradata.ca", "olivier@nexuradata.ca", "contact@nexuradata.ca"]);
    expect(body.subject).toContain("Nouveau lead");
    expect(body.text).toContain("NOUVEAU LEAD");
    expect(body.text).toContain("lead@example.com");
    expect(body.text).toContain("footer_notes");
    expect(body.text).toContain("google");
  });

  it("sends the express diagnostic to the prospect", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(resendOk());

    const result = await sendClientLeadMagnetEmail({
      email: "lead@example.com",
      name: "Marie",
      locale: "fr",
      sourceLabel: "assessment_form",
    });

    expect(result.sent).toBe(true);
    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["lead@example.com"]);
    expect(body.subject).toBe("Votre diagnostic express NEXURA");
    expect(body.text).toContain("Voici le diagnostic express promis");
    expect(body.text).toContain("https://nexuradata.ca/fr/operational-assessment?source=lead-magnet");
  });

  it("sends a visible Stripe checkout URL in the payment email", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(resendOk());

    const result = await sendClientPaymentLinkEmail({
      email: "lead@example.com",
      locale: "fr",
      checkoutUrl: "https://checkout.stripe.com/c/pay_test_123",
      productName: "Revue operationnelle",
      amount: "$250 CAD",
      sessionId: "cs_test_123",
    });

    expect(result.sent).toBe(true);
    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["lead@example.com"]);
    expect(body.subject).toBe("Lien de paiement securise NEXURA");
    expect(body.text).toContain("https://checkout.stripe.com/c/pay_test_123");
    expect(body.html).toContain("https://checkout.stripe.com/c/pay_test_123");
  });
});