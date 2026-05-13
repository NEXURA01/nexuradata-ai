import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, locale = "fr" } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Get Supabase credentials from env
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Supabase not configured for newsletter");
      // Still return success to not expose internal errors
      return NextResponse.json({ success: true });
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
        return NextResponse.json({ success: true, message: "Already subscribed" });
      }
      console.error("[v0] Newsletter subscription error:", error);
    }

    // TODO: Send welcome email via Resend
    // This would use the existing email.js library pattern

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Newsletter error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
