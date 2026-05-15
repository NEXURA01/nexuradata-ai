import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sourceCitiesLeads, insertLeadsToSupabase, getLeadsForOutreach } from "@/lib/lead-sourcing";
import { sendOutreachSequence } from "@/lib/outreach";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Check if already ran today
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRun } = await supabase
      .from("lead_daily_stats")
      .select("*")
      .eq("date", today)
      .single();

    if (todayRun && todayRun.leads_sent > 0) {
      return NextResponse.json(
        { message: "Already ran today", stats: todayRun },
        { status: 200 }
      );
    }

    // 1. Source new leads from Google Maps
    const cities = ["Montreal", "Quebec City", "Laval"];
    const newLeads = await sourceCitiesLeads(cities, 40);

    if (newLeads.length === 0) {
      return NextResponse.json(
        { error: "No leads sourced today" },
        { status: 400 }
      );
    }

    // 2. Insert to Supabase
    const insertedIds = await insertLeadsToSupabase(newLeads);

    // 3. Get leads ready for outreach
    const leadsToContact = await getLeadsForOutreach(40);

    if (leadsToContact.length === 0) {
      return NextResponse.json(
        { error: "No leads available for outreach" },
        { status: 400 }
      );
    }

    // 4. Get Calendly URL (should be env var)
    const calendlyUrl =
      process.env.CALENDLY_BOOKING_URL ||
      "https://calendly.com/nexura-scheduler";

    // 5. Send outreach (rate-limited)
    const outreachResults = await sendOutreachSequence(
      leadsToContact,
      calendlyUrl
    );

    // 6. Record daily stats
    await supabase.from("lead_daily_stats").insert([
      {
        date: today,
        leads_sent: outreachResults.sent,
        leads_responded: 0, // Will update as responses come in
        leads_qualified: 0,
        leads_booked: 0,
      },
    ]);

    return NextResponse.json(
      {
        message: "Daily outreach started",
        leads_sourced: newLeads.length,
        leads_queued: leadsToContact.length,
        leads_sent: outreachResults.sent,
        leads_failed: outreachResults.failed,
        results: outreachResults.results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Daily run error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
