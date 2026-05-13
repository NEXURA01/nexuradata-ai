import { createClient } from "@supabase/supabase-js";
import { jsonWithSecurity } from "@/lib/request-guard";
import { sendClientLeadFollowUpEmail } from "@/lib/server-email";

type FollowUpRecord = {
  id: string;
  email?: string | null;
  name?: string | null;
  company?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  locale?: string | null;
  source_path?: string | null;
  source_label?: string | null;
  follow_up_stage?: number | null;
};

type SupabaseUpdateClient = {
  from: (table: string) => {
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
};

const dayMs = 24 * 60 * 60 * 1000;

const nextFollowUpAt = (stage: number) => {
  if (stage >= 3) {
    return null;
  }

  return new Date(Date.now() + (stage === 1 ? 3 : 7) * dayMs).toISOString();
};

const assertAuthorized = (req: Request) => {
  const secret = process.env.LEAD_FOLLOW_UP_SECRET || process.env.CRON_SECRET;

  if (!secret) {
    return { ok: false, response: jsonWithSecurity({ ok: false, error: "follow-up-secret-not-configured" }, { status: 503 }) };
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, response: jsonWithSecurity({ ok: false, error: "unauthorized" }, { status: 401 }) };
  }

  return { ok: true };
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

const sendAndAdvance = async (
  req: Request,
  supabase: unknown,
  table: "lead_captures" | "leads",
  record: FollowUpRecord
) => {
  const stage = record.follow_up_stage || 0;
  const nextStage = stage + 1;
  const delivery = await sendClientLeadFollowUpEmail(
    {
      email: record.email || "",
      name: record.name || record.contact_name || "",
      company: record.company || record.company_name || "",
      locale: record.locale || "fr",
      sourcePath: record.source_path || "",
      sourceLabel: record.source_label || "lead_follow_up",
    },
    nextStage,
    req,
  );

  if (!delivery.sent) {
    return { sent: false, reason: delivery.reason || "delivery-failed" };
  }

  const updatePayload = {
    follow_up_stage: nextStage,
    follow_up_next_at: nextFollowUpAt(nextStage),
    last_follow_up_sent_at: new Date().toISOString(),
    status: nextStage >= 3 ? "followed_up" : "new",
  };
  const supabaseUpdateClient = supabase as unknown as SupabaseUpdateClient;
  const { error } = await supabaseUpdateClient.from(table).update(updatePayload).eq("id", record.id);

  if (error) {
    console.error("Lead follow-up update error:", table, error);
    return { sent: true, updated: false, reason: "update-failed" };
  }

  return { sent: true, updated: true };
};

export async function GET(req: Request) {
  const authorization = assertAuthorized(req);

  if (!authorization.ok) {
    return authorization.response;
  }

  const supabase = getSupabase();

  if (!supabase) {
    return jsonWithSecurity({ ok: false, error: "supabase-not-configured" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const [capturesResult, leadsResult] = await Promise.all([
    supabase
      .from("lead_captures")
      .select("id,email,name,company,locale,source_path,source_label,follow_up_stage")
      .eq("follow_up_consent", true)
      .eq("status", "new")
      .lte("follow_up_next_at", now)
      .lt("follow_up_stage", 3)
      .limit(20),
    supabase
      .from("leads")
      .select("id,email,contact_name,company_name,locale,source_path,source_label,follow_up_stage")
      .eq("follow_up_consent", true)
      .eq("status", "new")
      .lte("follow_up_next_at", now)
      .lt("follow_up_stage", 3)
      .limit(20),
  ]);

  if (capturesResult.error || leadsResult.error) {
    console.error("Lead follow-up query error:", capturesResult.error || leadsResult.error);
    return jsonWithSecurity({ ok: false, error: "follow-up-query-failed" }, { status: 503 });
  }

  const captures = (capturesResult.data || []) as FollowUpRecord[];
  const leads = (leadsResult.data || []) as FollowUpRecord[];
  const results = [];

  for (const record of captures) {
    results.push(await sendAndAdvance(req, supabase, "lead_captures", record));
  }

  for (const record of leads) {
    results.push(await sendAndAdvance(req, supabase, "leads", record));
  }

  return jsonWithSecurity({
    ok: true,
    processed: results.length,
    sent: results.filter((result) => result.sent).length,
    updated: results.filter((result) => result.updated).length,
  });
}