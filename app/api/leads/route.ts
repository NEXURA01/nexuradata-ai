import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create_lead") {
      return await createLead(body);
    } else if (action === "update_lead_status") {
      return await updateLeadStatus(body);
    } else if (action === "log_interaction") {
      return await logInteraction(body);
    } else if (action === "get_daily_stats") {
      return await getDailyStats();
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function createLead(body: any) {
  const supabase = getSupabaseClient();
  const {
    phone,
    name,
    business_name,
    business_type,
    property_age_years,
    address,
    city,
    postal_code,
    email,
    score,
    intent_signal,
    source,
  } = body;

  // Check for duplicate
  const { data: existing } = await supabase
    .from("leads_landscaping")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Lead already exists", lead_id: existing.id },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("leads_landscaping")
    .insert([
      {
        phone,
        name,
        business_name,
        business_type,
        property_age_years,
        address,
        city,
        postal_code,
        email,
        score: score || 5,
        intent_signal,
        source: source || "google_maps",
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

async function updateLeadStatus(body: any) {
  const supabase = getSupabaseClient();
  const { lead_id, status, booking_value, booking_type, response_type } = body;

  const updateData: any = { status, updated_at: new Date() };

  if (status === "contacted") {
    updateData.first_contact_at = new Date();
  }
  if (status === "booked") {
    updateData.booked_at = new Date();
    updateData.booking_value = booking_value;
    updateData.booking_type = booking_type;
  }
  if (response_type) {
    updateData.responded_at = new Date();
    updateData.response_type = response_type;
  }

  const { data, error } = await supabase
    .from("leads_landscaping")
    .update(updateData)
    .eq("id", lead_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

async function logInteraction(body: any) {
  const supabase = getSupabaseClient();
  const { lead_id, interaction_type, status, message_preview, metadata } = body;

  const { data, error } = await supabase
    .from("lead_interactions")
    .insert([
      {
        lead_id,
        interaction_type,
        status,
        message_preview,
        metadata: metadata || {},
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Auto-update lead status based on interaction
  if (interaction_type === "whatsapp_sent" && status === "delivered") {
    await supabase
      .from("leads_landscaping")
      .update({ status: "contacted" })
      .eq("id", lead_id);
  }

  if (interaction_type === "response_received") {
    await supabase
      .from("leads_landscaping")
      .update({ status: "qualified", responded_at: new Date() })
      .eq("id", lead_id);
  }

  return NextResponse.json(data);
}

async function getDailyStats() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: stats } = await supabase
    .from("lead_daily_stats")
    .select("*")
    .eq("date", today)
    .single();

  if (!stats) {
    // Calculate from interactions
    const { count: sent } = await supabase
      .from("lead_interactions")
      .select("*", { count: "exact" })
      .gte("timestamp", `${today}T00:00:00`)
      .eq("interaction_type", "whatsapp_sent");

    const { count: responded } = await supabase
      .from("leads_landscaping")
      .select("*", { count: "exact" })
      .gte("responded_at", `${today}T00:00:00`);

    const { count: qualified } = await supabase
      .from("leads_landscaping")
      .select("*", { count: "exact" })
      .eq("status", "qualified")
      .gte("updated_at", `${today}T00:00:00`);

    const { count: booked } = await supabase
      .from("leads_landscaping")
      .select("*", { count: "exact" })
      .eq("status", "booked")
      .gte("booked_at", `${today}T00:00:00`);

    return NextResponse.json({
      date: today,
      leads_sent: sent || 0,
      leads_responded: responded || 0,
      leads_qualified: qualified || 0,
      leads_booked: booked || 0,
    });
  }

  return NextResponse.json(stats);
}
