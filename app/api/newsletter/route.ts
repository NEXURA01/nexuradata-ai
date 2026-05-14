import { guardPublicPost, hasFilledHoneypot, jsonWithSecurity } from "@/lib/request-guard";

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "newsletter", maxRequests: 5 });

  if (guarded) {
    return guarded;
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (hasFilledHoneypot(body)) {
      return jsonWithSecurity({ success: true });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 220) : "";
    const locale = typeof body.locale === "string" ? body.locale.trim().slice(0, 12) : "fr";

    if (!isValidEmail(email)) {
      return jsonWithSecurity({ error: "Invalid email" }, { status: 400 });
    }

    // Get Supabase credentials from env
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Newsletter Supabase not configured");
      // Still return success to not expose internal errors
      return jsonWithSecurity({ success: true });
    }

    // Insert into newsletter_subscribers table
    const response = await fetch(`${supabaseUrl}/rest/v1/newsletter_subscribers`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email,
        language: locale,
        subscribed_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      // Check if it's a duplicate email error
      if (error.includes("duplicate") || error.includes("unique")) {
        return jsonWithSecurity({ success: true, message: "Already subscribed" });
      }
      console.error("Newsletter subscription error:", error);
    }

    // TODO: Send welcome email via Resend
    // This would use the existing email.js library pattern

    return jsonWithSecurity({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return jsonWithSecurity({ error: "Internal error" }, { status: 500 });
  }
}
