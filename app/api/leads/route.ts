import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_ACTIONS = new Set(["create_lead", "update_lead_status", "log_interaction", "get_daily_stats"]);
const VALID_STATUSES = new Set(["new", "contacted", "qualified", "booked", "archived"]);

function getToken(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function requireLeadApiAuth(req: NextRequest) {
  const secret = process.env.LEAD_API_SECRET || process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, error: "lead-api-secret-not-configured" }, { status: 503 });
  }

  if (getToken(req) !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase lead storage is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

const normalizeText = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const normalizePhone = (value: unknown) => normalizeText(value, 40).replace(/\D/g, "");

export async function POST(req: NextRequest) {
  const unauthorized = requireLeadApiAuth(req);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = normalizeText(body.action, 80);

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (action === "create_lead") return await createLead(body);
    if (action === "update_lead_status") return await updateLeadStatus(body);
    if (action === "log_interaction") return await logInteraction(body);
    return await getDailyStats();
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: "Lead API request failed" }, { status: 500 });
  }
}

async function createLead(body: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  const phone = normalizePhone(body.phone);
  const name = normalizeText(body.name, 180);
  const businessName = normalizeText(body.business_name, 220) || name;
  const scoreNumber = Number(body.score || 5);
  const propertyAgeNumber = Number(body.property_age_years || 0);

  if (phone.length < 10 || phone.length > 15 || !name) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("leads_landscaping")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Lead already exists", lead_id: existing.id }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("leads_landscaping")
    .insert([
      {
        phone,
        name,
        business_name: businessName,
        business_type: normalizeText(body.business_type, 80) || "commercial",
        property_age_years: Number.isFinite(propertyAgeNumber) && propertyAgeNumber > 0 ? Math.round(propertyAgeNumber) : null,
        address: normalizeText(body.address, 280),
        city: normalizeText(body.city, 120),
        postal_code: normalizeText(body.postal_code, 40),
        email: normalizeText(body.email, 220).toLowerCase() || null,
        score: Number.isFinite(scoreNumber) ? Math.max(1, Math.min(10, Math.round(scoreNumber))) : 5,
        intent_signal: normalizeText(body.intent_signal, 120),
        source: normalizeText(body.source, 120) || "google_maps",
        status: "new",
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

async function updateLeadStatus(body: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  const leadId = normalizeText(body.lead_id, 80);
  const status = normalizeText(body.status, 40);

  if (!leadId || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid lead status payload" }, { status: 400 });
  }

  const bookingValue = Number(body.booking_value);
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

  if (status === "contacted") updateData.first_contact_at = new Date().toISOString();
  if (status === "booked") {
    updateData.booked_at = new Date().toISOString();
    if (Number.isFinite(bookingValue)) updateData.booking_value = bookingValue;
    const bookingType = normalizeText(body.booking_type, 80);
    if (bookingType) updateData.booking_type = bookingType;
  }

  const responseType = normalizeText(body.response_type, 80);
  if (responseType) {
    updateData.responded_at = new Date().toISOString();
    updateData.response_type = responseType;
  }

  const { data, error } = await supabase
    .from("leads_landscaping")
    .update(updateData)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

async function logInteraction(body: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  const leadId = normalizeText(body.lead_id, 80);
  const interactionType = normalizeText(body.interaction_type, 80);
  const status = normalizeText(body.status, 80);

  if (!leadId || !interactionType || !status) {
    return NextResponse.json({ error: "Invalid interaction payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lead_interactions")
    .insert([
      {
        lead_id: leadId,
        interaction_type: interactionType,
        status,
        message_preview: normalizeText(body.message_preview, 180),
        metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {},
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (interactionType === "whatsapp_sent" && status === "delivered") {
    await supabase.from("leads_landscaping").update({ status: "contacted", updated_at: new Date().toISOString() }).eq("id", leadId);
  }

  if (interactionType === "response_received") {
    await supabase.from("leads_landscaping").update({ status: "qualified", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", leadId);
  }

  return NextResponse.json(data);
}

async function getDailyStats() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: stats } = await supabase.from("lead_daily_stats").select("*").eq("date", today).maybeSingle();

  if (!stats) {
    const { count: sent } = await supabase.from("lead_interactions").select("*", { count: "exact", head: true }).gte("timestamp", `${today}T00:00:00`).eq("interaction_type", "whatsapp_sent");
    const { count: responded } = await supabase.from("leads_landscaping").select("*", { count: "exact", head: true }).gte("responded_at", `${today}T00:00:00`);
    const { count: qualified } = await supabase.from("leads_landscaping").select("*", { count: "exact", head: true }).eq("status", "qualified").gte("updated_at", `${today}T00:00:00`);
    const { count: booked } = await supabase.from("leads_landscaping").select("*", { count: "exact", head: true }).eq("status", "booked").gte("booked_at", `${today}T00:00:00`);

    return NextResponse.json({ date: today, leads_sent: sent || 0, leads_responded: responded || 0, leads_qualified: qualified || 0, leads_booked: booked || 0 });
  }

  return NextResponse.json(stats);
}
