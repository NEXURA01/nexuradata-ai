import { describe, it, expect, vi, beforeEach } from "vitest";

// All DB calls in email.js go through getDb(env) → neon(url). We stub neon
// to return a tagged-template function that resolves based on the SQL text,
// so we can support sendClientStatusEmail (which runs getCaseDetail → 3 queries).
let neonResponder = () => [];

vi.mock("@neondatabase/serverless", () => ({
  neon: () => (strings, ...values) => Promise.resolve(neonResponder(strings, values))
}));

import {
  sendLabNotificationEmail,
  sendTeamOperationalAssessmentEmail,
  sendTeamPaymentCompletedEmail,
  sendClientAccessEmail,
  sendClientStatusEmail,
  sendClientPaymentLinkEmail
} from "../../functions/_lib/email.js";

const RESEND_OK = () =>
  new Response(JSON.stringify({ id: "email-id-123" }), { status: 200 });

const baseEnv = {
  RESEND_API_KEY: "re_test_key",
  RESEND_FROM_EMAIL: "noreply@nexuradata.ca",
  DATABASE_URL: "postgresql://test"
};

beforeEach(() => {
  vi.restoreAllMocks();
  neonResponder = () => [];
});

// ─── sendLabNotificationEmail ───────────────────────────────

describe("sendLabNotificationEmail()", () => {
  const minimalRecord = { caseId: "NX-1", support: "SSD", urgence: "Standard" };

  it("returns missing-team-inbox when no team inbox is set", async () => {
    const result = await sendLabNotificationEmail({}, minimalRecord, "https://nexuradata.ca/api");
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("missing-team-inbox");
  });

  it("returns not-configured when RESEND_API_KEY is absent", async () => {
    const result = await sendLabNotificationEmail(
      { LAB_INBOX_EMAIL: "lab@test.com" },
      minimalRecord,
      "https://nexuradata.ca/api"
    );
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("not-configured");
  });

  it("calls Resend API with correct payload when configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    const env = { ...baseEnv, LAB_INBOX_EMAIL: "lab@test.com" };
    const record = {
      caseId: "NX-20260101-ABCD1234",
      support: "Disque dur",
      urgence: "Standard",
      nom: "Jean Dupont",
      courriel: "jean@test.com",
      telephone: "514-555-0100",
      accessCode: "ABCD-EFGH",
      sourcePath: "/",
      message: "Mon disque ne fonctionne plus."
    };

    const result = await sendLabNotificationEmail(env, record, "https://nexuradata.ca/api");
    expect(result.sent).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer re_test_key");
    expect(options.headers["Idempotency-Key"]).toBe("lab-intake-NX-20260101-ABCD1234");

    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["lab@test.com"]);
    expect(body.subject).toContain("NX-20260101-ABCD1234");
    expect(body.from).toBe("noreply@nexuradata.ca");
  });

  it("sends intake notifications to every configured team recipient", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());
    const env = { ...baseEnv, TEAM_INBOX_EMAILS: "dany@nexuradata.ca olivier@nexuradata.ca contact@nexuradata.ca dany@nexuradata.ca" };

    await sendLabNotificationEmail(env, minimalRecord, "https://nexuradata.ca/api");

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["dany@nexuradata.ca", "olivier@nexuradata.ca", "contact@nexuradata.ca"]);
  });

  it("returns api-XXX reason on non-2xx Resend response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid api key", { status: 401 })
    );

    const result = await sendLabNotificationEmail(
      { ...baseEnv, LAB_INBOX_EMAIL: "lab@test.com" },
      { caseId: "NX-1", support: "SSD", urgence: "Standard" },
      "https://nexuradata.ca/api"
    );
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("api-401");
    expect(result.error).toBe("invalid api key");
  });

  it("returns network-error reason when fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNRESET"));

    const result = await sendLabNotificationEmail(
      { ...baseEnv, LAB_INBOX_EMAIL: "lab@test.com" },
      { caseId: "NX-1", support: "SSD", urgence: "Standard" },
      "https://nexuradata.ca/api"
    );
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("network-error");
    expect(result.error).toBe("ECONNRESET");
  });
});

describe("team notification emails", () => {
  it("notifies the team when an operational assessment is generated", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());
    const result = await sendTeamOperationalAssessmentEmail(
      { ...baseEnv, TEAM_INBOX_EMAILS: "ops@test.com,dossiers@test.com" },
      {
        payload: {
          organization: "NEXURA Client",
          contact_name: "Marie",
          email: "marie@test.com",
          urgency: "Cette semaine",
          teams_involved: "Operations, finance",
          workflow_summary: "Le client veut centraliser les demandes et la validation interne."
        },
        lead: { id: "lead-1" },
        estimate: {
          estimated_min: 150000,
          estimated_max: 300000,
          confidence_score: "medium",
          recommended_scope: "Workflow centralise"
        },
        workflowCase: { id: "workflow-1" }
      },
      "https://nexuradata.ca/api/estimate"
    );

    expect(result.sent).toBe(true);
    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["ops@test.com", "dossiers@test.com"]);
    expect(body.subject).toContain("NEXURA Client");
    expect(body.text).toContain("Workflow centralise");
  });

  it("notifies the team when an operational payment is confirmed", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());
    const result = await sendTeamPaymentCompletedEmail(
      { ...baseEnv, TEAM_INBOX_EMAILS: "ops@test.com" },
      {
        payment: {
          id: "payment-1",
          payment_request_id: "PAY-1",
          stripe_session_id: "cs_test",
          amount: 25000,
          currency: "cad",
          customer_email: "client@test.com",
          workflow_case_id: "workflow-1"
        },
        workflowCase: { id: "workflow-1" },
        event: { id: "evt-1", type: "checkout.session.completed", data: { object: { id: "cs_test" } } }
      },
      "https://nexuradata.ca/api/stripe-webhook"
    );

    expect(result.sent).toBe(true);
    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers["Idempotency-Key"]).toBe("team-payment-evt-1-payment-1-cs_test");
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["ops@test.com"]);
    expect(body.text).toContain("PAY-1");
  });
});

// ─── sendClientAccessEmail ──────────────────────────────────

describe("sendClientAccessEmail()", () => {
  const record = {
    caseId: "NX-20260101-A1B2C3D4",
    accessCode: "TEST-CODE",
    email: "client@test.com",
    name: "Marie",
    status: "Dossier reçu",
    nextStep: "Évaluation"
  };

  it("returns not-configured when RESEND is not set up", async () => {
    const result = await sendClientAccessEmail({}, record, "https://nexuradata.ca/api");
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("not-configured");
  });

  it("sends email with initial subject + idempotency key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    const result = await sendClientAccessEmail(baseEnv, record, "https://nexuradata.ca/api", "initial");
    expect(result.sent).toBe(true);

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.subject).toContain("Dossier");
    expect(body.subject).toContain("NX-20260101-A1B2C3D4");
    expect(body.to).toEqual(["client@test.com"]);
    expect(options.headers["Idempotency-Key"]).toBe("initial-access-NX-20260101-A1B2C3D4");
  });

  it("uses regenerated subject + idempotency key for reason='regenerated'", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    await sendClientAccessEmail(baseEnv, record, "https://nexuradata.ca/api", "regenerated");

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.subject).toContain("Nouveau code d'accès");
    expect(options.headers["Idempotency-Key"]).toBe("regenerated-access-NX-20260101-A1B2C3D4");
  });

  it("uses 'Rappel' subject for reason='resent'", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    await sendClientAccessEmail(baseEnv, record, "https://nexuradata.ca/api", "resent");

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.subject).toContain("Rappel du code d'accès");
    expect(body.subject).toContain("NX-20260101-A1B2C3D4");
  });
});

// ─── sendClientStatusEmail ──────────────────────────────────

describe("sendClientStatusEmail()", () => {
  const caseRow = {
    case_id: "NX-20260101-STATUS01",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-19T12:00:00Z",
    name: "Paul",
    email: "paul@test.com",
    status: "En cours",
    next_step: "Lecture du support",
    client_summary: "Le laboratoire a démarré l'évaluation."
  };

  // Distinguish queries by inspecting the SQL text.
  const sqlText = (strings) => strings.join("?");

  it("throws 'Dossier introuvable.' when getCaseDetail returns null", async () => {
    neonResponder = () => []; // every query returns no rows → getCaseRow → null
    await expect(
      sendClientStatusEmail(baseEnv, "NX-MISSING", "https://nexuradata.ca/api")
    ).rejects.toThrow("Dossier introuvable.");
  });

  it("sends a status update email when the case exists", async () => {
    neonResponder = (strings) => {
      const text = sqlText(strings);
      if (text.includes("FROM cases")) return [caseRow];
      return []; // timeline, payments, history all empty
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    const result = await sendClientStatusEmail(
      baseEnv,
      "NX-20260101-STATUS01",
      "https://nexuradata.ca/api"
    );

    expect(result.delivery.sent).toBe(true);
    expect(result.detail.caseId).toBe("NX-20260101-STATUS01");

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["paul@test.com"]);
    expect(body.subject).toBe("Mise à jour du dossier NX-20260101-STATUS01");
    expect(body.text).toContain("En cours");
    expect(body.text).toContain("Lecture du support");
  });

  it("returns delivery failure without throwing when Resend is not configured", async () => {
    neonResponder = (strings) => {
      const text = sqlText(strings);
      if (text.includes("FROM cases")) return [caseRow];
      return [];
    };

    const result = await sendClientStatusEmail(
      { DATABASE_URL: "postgresql://test" },
      "NX-20260101-STATUS01",
      "https://nexuradata.ca/api"
    );
    expect(result.delivery.sent).toBe(false);
    expect(result.delivery.reason).toBe("not-configured");
    expect(result.detail.caseId).toBe("NX-20260101-STATUS01");
  });
});

// ─── sendClientPaymentLinkEmail ─────────────────────────────

describe("sendClientPaymentLinkEmail()", () => {
  const payment = {
    paymentRequestId: "PAY-20260101-ABCD12",
    caseId: "NX-20260101-PAYMENT1",
    label: "Dépôt initial",
    description: "Dépôt pour ouverture du dossier.",
    amountCents: 15000,
    currency: "cad",
    customerEmail: "client@test.com",
    checkoutUrl: "https://checkout.stripe.com/c/test"
  };

  it("throws when customerEmail is missing", async () => {
    await expect(
      sendClientPaymentLinkEmail(baseEnv, { ...payment, customerEmail: "" }, "https://nexuradata.ca/api")
    ).rejects.toThrow("Demande de paiement incomplète.");
  });

  it("throws when checkoutUrl is missing", async () => {
    await expect(
      sendClientPaymentLinkEmail(baseEnv, { ...payment, checkoutUrl: "" }, "https://nexuradata.ca/api")
    ).rejects.toThrow("Demande de paiement incomplète.");
  });

  it("returns not-configured when Resend is not set up", async () => {
    const result = await sendClientPaymentLinkEmail(
      { DATABASE_URL: "postgresql://test" },
      payment,
      "https://nexuradata.ca/api"
    );
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("not-configured");
  });

  it("sends payment link with formatted amount in subject and body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(RESEND_OK());

    const result = await sendClientPaymentLinkEmail(baseEnv, payment, "https://nexuradata.ca/api");
    expect(result.sent).toBe(true);

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(["client@test.com"]);
    expect(body.subject).toContain("Dépôt initial");
    expect(body.subject).toContain("NX-20260101-PAYMENT1");
    expect(body.subject).toMatch(/150[\s,]00/); // "150,00 $" in fr-CA
    expect(body.text).toContain("https://checkout.stripe.com/c/test");
    expect(options.headers["Idempotency-Key"]).toBe("payment-link-PAY-20260101-ABCD12");
  });
});
