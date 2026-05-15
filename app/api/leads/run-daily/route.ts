import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sourceCampaignLeads, insertLeadsToSupabase, getLeadsForOutreach } from "@/lib/lead-sourcing";
import { sendOutreachSequence } from "@/lib/outreach";
import { getCampaignPlanForDate } from "@/lib/email-campaign";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const configuredApiKey = process.env.LEADS_API_KEY;
    const requestApiKey = req.headers.get("x-api-key");
    const requireApiKey =
      process.env.NODE_ENV === "production" ||
      process.env.LEADS_API_KEY_REQUIRED === "true";

    if (requireApiKey && !configuredApiKey) {
      return NextResponse.json(
        { error: "LEADS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (configuredApiKey && requestApiKey !== configuredApiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { data: firstRun } = await supabase
      .from("lead_daily_stats")
      .select("date")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    const campaignPlan = getCampaignPlanForDate(new Date(), firstRun?.date || today);

    if (!campaignPlan.active || !campaignPlan.plan) {
      return NextResponse.json(
        { message: "15-day campaign completed", campaign_complete: true },
        { status: 200 }
      );
    }

    // 1. Source new leads from Google Maps for today's region and industries
    const newLeads = await sourceCampaignLeads(
      [campaignPlan.plan.region],
      campaignPlan.plan.industries,
      campaignPlan.plan.quota
    );

    if (newLeads.length === 0) {
      return NextResponse.json(
        { error: "No leads sourced today" },
        { status: 400 }
      );
    }

    // 2. Insert to Supabase
    const insertedIds = await insertLeadsToSupabase(newLeads);

    // 3. Get leads ready for outreach
    const leadsToContact = await getLeadsForOutreach(campaignPlan.plan.quota, {
      region: campaignPlan.plan.region,
      industries: campaignPlan.plan.industries,
      createdSince: `${today}T00:00:00`,
    });

    if (leadsToContact.length === 0) {
      return NextResponse.json(
        { error: "No leads available for outreach" },
        { status: 400 }
      );
    }

    // 4. Send outreach (email-only)
    const outreachResults = await sendOutreachSequence(
      leadsToContact,
      campaignPlan.plan,
      campaignPlan.plan.industries[0]
    );

    // 5. Record daily stats
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
        campaign: campaignPlan.plan,
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
