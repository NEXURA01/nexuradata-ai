import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sourceCampaignLeads, insertLeadsToSupabase, getLeadsForOutreach } from "@/lib/lead-sourcing";
import { sendOutreachSequence } from "@/lib/outreach";
import { getCampaignPlanForDate } from "@/lib/email-campaign";
import { jsonWithSecurity } from "@/lib/request-guard";

class StepTimeoutError extends Error {
  constructor(step: string, timeoutMs: number) {
    super(`${step} timed out after ${timeoutMs}ms`);
    this.name = "StepTimeoutError";
  }
}

const withTimeout = async <T>(step: string, timeoutMs: number, promise: Promise<T>): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new StepTimeoutError(step, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function resolveRunMode(req: NextRequest, forcedMode?: "prepare" | "send") {
  if (forcedMode) {
    return forcedMode;
  }

  try {
    const body = await req.json();
    if (body && typeof body === "object" && (body as Record<string, unknown>).mode === "prepare") {
      return "prepare" as const;
    }
  } catch {
    // ignore body parsing failures and use default mode
  }

  return "send" as const;
}

export async function runDailyLeads(req: NextRequest, forcedMode?: "prepare" | "send") {
  try {
    const sourceTimeoutMs = Number(process.env.LEADS_SOURCE_TIMEOUT_MS || 55000);
    const outreachTimeoutMs = Number(process.env.LEADS_OUTREACH_TIMEOUT_MS || 35000);
    const dailySecret = process.env.LEAD_DAILY_SECRET;

    if (!dailySecret) {
      return jsonWithSecurity({ ok: false, error: "lead-daily-secret-not-configured" }, { status: 503 });
    }

    if (req.headers.get("authorization") !== `Bearer ${dailySecret}`) {
      return jsonWithSecurity({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const runMode = await resolveRunMode(req, forcedMode);

    const configuredApiKey = process.env.LEADS_API_KEY;
    const requestApiKey = req.headers.get("x-api-key");
    const requireApiKey =
      process.env.NODE_ENV === "production" ||
      process.env.LEADS_API_KEY_REQUIRED === "true";

    if (requireApiKey && !configuredApiKey) {
      return jsonWithSecurity(
        { error: "LEADS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (configuredApiKey && requestApiKey !== configuredApiKey) {
      return jsonWithSecurity({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const today = new Date().toISOString().split("T")[0];
    const { data: todayRun } = await supabase
      .from("lead_daily_stats")
      .select("*")
      .eq("date", today)
      .single();

    if (todayRun && todayRun.leads_sent > 0) {
      return jsonWithSecurity(
        {
          ok: true,
          message: "Already ran today",
          leads_sourced: 0,
          leads_inserted: 0,
          leads_queued: 0,
          leads_sent: todayRun.leads_sent || 0,
          leads_failed: todayRun.messages_failed || 0,
        },
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
      return jsonWithSecurity(
        { ok: true, message: "15-day campaign completed", campaign_complete: true },
        { status: 200 }
      );
    }

    const newLeads = await withTimeout(
      "source-campaign-leads",
      sourceTimeoutMs,
      sourceCampaignLeads(
        [campaignPlan.plan.region],
        campaignPlan.plan.industries,
        campaignPlan.plan.quota
      )
    );

    if (newLeads.length === 0) {
      return jsonWithSecurity(
        { ok: false, error: "No leads sourced today" },
        { status: 400 }
      );
    }

    const insertedIds = await insertLeadsToSupabase(newLeads);

    const dailyCap = Math.max(1, Number(process.env.LEADS_DAILY_CAP_PER_VERTICAL || campaignPlan.plan.quota));

    const leadsToContact = await getLeadsForOutreach(dailyCap, {
      region: campaignPlan.plan.region,
      industries: campaignPlan.plan.industries,
      createdSince: `${today}T00:00:00`,
    });

    if (leadsToContact.length === 0) {
      return jsonWithSecurity(
        { ok: false, error: "No leads available for outreach" },
        { status: 400 }
      );
    }

    if (runMode === "prepare") {
      const nowIso = new Date().toISOString();
      const preparedRows = leadsToContact.map((lead) => ({
        lead_id: lead.id,
        interaction_type: "email_prepared",
        channel: "email",
        direction: "outbound",
        template_key: `day_${campaignPlan.plan?.day || "x"}_${campaignPlan.plan?.industries?.[0] || "generic"}`,
        consent_checked: true,
        status: "queued",
        timestamp: nowIso,
        metadata: {
          region: campaignPlan.plan?.region,
          vertical: campaignPlan.plan?.industries?.[0] || "generic",
          run_mode: "prepare",
        },
      }));

      await supabase.from("lead_interactions").insert(preparedRows);

      return jsonWithSecurity(
        {
          ok: true,
          mode: "prepare",
          leads_sourced: newLeads.length,
          leads_inserted: insertedIds.length,
          leads_queued: leadsToContact.length,
          leads_sent: 0,
          leads_failed: 0,
        },
        { status: 200 }
      );
    }

    const outreachResults = await withTimeout(
      "send-outreach-sequence",
      outreachTimeoutMs,
      sendOutreachSequence(
        leadsToContact,
        campaignPlan.plan,
        campaignPlan.plan.industries[0]
      )
    );

    await supabase.from("lead_daily_stats").insert([
      {
        date: today,
        vertical: campaignPlan.plan.industries[0] || "landscaping",
        channel: "email",
        leads_sent: outreachResults.sent,
        leads_responded: 0,
        leads_qualified: 0,
        leads_booked: 0,
        leads_opted_out: 0,
        messages_failed: outreachResults.failed,
      },
    ]);

    return jsonWithSecurity(
      {
        ok: true,
        mode: "send",
        leads_sourced: newLeads.length,
        leads_inserted: insertedIds.length,
        leads_queued: leadsToContact.length,
        leads_sent: outreachResults.sent,
        leads_failed: outreachResults.failed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Daily run error:", error);

    if (error instanceof StepTimeoutError) {
      return jsonWithSecurity(
        { ok: false, error: error.message, code: "daily-run-timeout" },
        { status: 504 }
      );
    }

    return jsonWithSecurity({ ok: false, error: "daily-run-failed" }, { status: 500 });
  }
}
