import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCampaignPlanForDate, getCampaignPlanSummary } from "@/lib/email-campaign";
import { jsonWithSecurity } from "@/lib/request-guard";

const ALLOWED_ACTIONS = new Set([
  "create_lead",
  "update_lead_status",
  "log_interaction",
  "get_daily_stats",
  "get_campaign_plan",
]);

const ALLOWED_STATUS = new Set(["new", "contacted", "qualified", "booked", "archived", "followed_up"]);
const ALLOWED_CONTACT_CHANNEL = new Set(["whatsapp", "sms", "email", "phone", "manual"]);
const ALLOWED_RESPONSE_TYPE = new Set(["positive", "negative", "maybe"]);
const ALLOWED_INTERACTION_TYPE = new Set([
  "whatsapp_sent",
  "sms_sent",
  "call",
  "email_sent",
  "response_received",
  "email_replied",
]);
const ALLOWED_DIRECTION = new Set(["outbound", "inbound", "system"]);

const assertAuthorized = (req: NextRequest) => {
  const secret = process.env.LEAD_API_SECRET || process.env.LEADS_API_SECRET || process.env.LEAD_FOLLOW_UP_SECRET || process.env.CRON_SECRET;

  if (!secret) {
    return {
      ok: false,
      response: jsonWithSecurity({ ok: false, error: "leads-api-secret-not-configured" }, { status: 503 }),
    };
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return {
      ok: false,
      response: jsonWithSecurity({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return asString(value);
}

function asOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    supabaseKey
  );
}

type SupabaseClientType = NonNullable<ReturnType<typeof getSupabaseClient>>;

export async function POST(req: NextRequest) {
  const authorization = assertAuthorized(req);

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return jsonWithSecurity({ ok: false, error: "supabase-not-configured" }, { status: 503 });
    }

    const rawBody = await req.json();
    const body = asRecord(rawBody);

    if (!body) {
      return jsonWithSecurity({ ok: false, error: "invalid-body" }, { status: 400 });
    }

    const action = asString(body.action);

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return jsonWithSecurity({ ok: false, error: "unknown-action" }, { status: 400 });
    }

    if (action === "create_lead") {
      return await createLead(supabase, body);
    } else if (action === "update_lead_status") {
      return await updateLeadStatus(supabase, body);
    } else if (action === "log_interaction") {
      return await logInteraction(supabase, body);
    } else if (action === "get_daily_stats") {
      return await getDailyStats(supabase);
    } else if (action === "get_campaign_plan") {
      return await getCampaignPlan(supabase);
    }

    return jsonWithSecurity({ ok: false, error: "unknown-action" }, { status: 400 });
  } catch (error) {
    console.error("Lead API error:", error);
    return jsonWithSecurity({ ok: false, error: "internal-error" }, { status: 500 });
  }
}

async function createLead(supabase: SupabaseClientType, body: Record<string, unknown>) {
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
    vertical,
    source_detail,
    acquisition_channel,
    consent_status,
    consent_source,
    do_not_contact,
    owner,
    tags,
    notes,
    metadata,
    contact_channel,
  } = body;

  const phoneValue = asString(phone);
  const nameValue = asString(name);
  const businessNameValue = asOptionalString(business_name);
  const cityValue = asOptionalString(city);
  const emailValue = asOptionalString(email)?.toLowerCase();

  if (!phoneValue || !nameValue) {
    return jsonWithSecurity({ ok: false, error: "missing-required-fields" }, { status: 400 });
  }

  const scoreValue = asOptionalNumber(score);
  const normalizedScore = scoreValue === null ? 5 : Math.max(1, Math.min(10, Math.trunc(scoreValue)));
  const contactChannelValue = asOptionalString(contact_channel) || "email";

  if (!ALLOWED_CONTACT_CHANNEL.has(contactChannelValue)) {
    return jsonWithSecurity({ ok: false, error: "invalid-contact-channel" }, { status: 400 });
  }

  const tagsValue = Array.isArray(tags)
    ? tags.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];

  const metadataValue = asRecord(metadata) || {};

  // Check for duplicate with landscaping-specific key when possible.
  const duplicateQuery = supabase
    .from("leads_landscaping")
    .select("id")
    .eq("phone", phoneValue);

  if (businessNameValue && cityValue) {
    duplicateQuery.eq("business_name", businessNameValue).eq("city", cityValue);
  }

  const { data: existing } = await duplicateQuery.maybeSingle();

  if (existing) {
    return jsonWithSecurity(
      { ok: false, error: "lead-already-exists", lead_id: existing.id },
      { status: 409 }
    );
  }

  if (emailValue) {
    const { data: existingByEmail } = await supabase
      .from("leads_landscaping")
      .select("id")
      .eq("email", emailValue)
      .maybeSingle();

    if (existingByEmail) {
      return jsonWithSecurity(
        { ok: false, error: "lead-already-exists", lead_id: existingByEmail.id },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("leads_landscaping")
    .insert([
      {
        phone: phoneValue,
        name: nameValue,
        business_name: businessNameValue,
        business_type: asOptionalString(business_type),
        property_age_years: asOptionalNumber(property_age_years),
        address: asOptionalString(address),
        city: cityValue,
        postal_code: asOptionalString(postal_code),
        email: emailValue,
        score: normalizedScore,
        intent_signal: asOptionalString(intent_signal),
        source: asOptionalString(source) || "google_maps",
        vertical: asOptionalString(vertical) || asOptionalString(business_type) || "landscaping",
        source_detail: asOptionalString(source_detail),
        acquisition_channel: asOptionalString(acquisition_channel),
        consent_status: asOptionalString(consent_status),
        consent_source: asOptionalString(consent_source),
        do_not_contact: do_not_contact === true,
        owner: asOptionalString(owner),
        tags: tagsValue,
        notes: asOptionalString(notes),
        metadata: metadataValue,
        contact_channel: contactChannelValue,
        status: "new",
      },
    ])
    .select()
    .single();

  if (error) {
    return jsonWithSecurity({ ok: false, error: "create-failed" }, { status: 400 });
  }

  return jsonWithSecurity(data, { status: 201 });
}

async function updateLeadStatus(supabase: SupabaseClientType, body: Record<string, unknown>) {
  const { lead_id, status, booking_value, booking_type, response_type } = body;

  const leadId = asString(lead_id);
  const nextStatus = asString(status);

  if (!leadId || !nextStatus || !ALLOWED_STATUS.has(nextStatus)) {
    return jsonWithSecurity({ ok: false, error: "invalid-status-update" }, { status: 400 });
  }

  const responseType = asOptionalString(response_type);

  if (responseType && !ALLOWED_RESPONSE_TYPE.has(responseType)) {
    return jsonWithSecurity({ ok: false, error: "invalid-response-type" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };

  if (nextStatus === "contacted") {
    updateData.first_contact_at = new Date().toISOString();
  }
  if (nextStatus === "booked") {
    updateData.booked_at = new Date().toISOString();
    updateData.booking_value = asOptionalNumber(booking_value);
    updateData.booking_type = asOptionalString(booking_type);
  }
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
    return jsonWithSecurity({ ok: false, error: "update-failed" }, { status: 400 });
  }

  return jsonWithSecurity(data);
}

async function logInteraction(supabase: SupabaseClientType, body: Record<string, unknown>) {
  const {
    lead_id,
    interaction_type,
    status,
    message_preview,
    metadata,
    channel,
    provider,
    provider_message_id,
    direction,
    template_key,
    consent_checked,
  } = body;

  const leadId = asString(lead_id);
  const interactionType = asString(interaction_type);

  if (!leadId || !interactionType || !ALLOWED_INTERACTION_TYPE.has(interactionType)) {
    return jsonWithSecurity({ ok: false, error: "invalid-interaction" }, { status: 400 });
  }

  const channelValue = asOptionalString(channel);
  if (channelValue && !ALLOWED_CONTACT_CHANNEL.has(channelValue)) {
    return jsonWithSecurity({ ok: false, error: "invalid-channel" }, { status: 400 });
  }

  const directionValue = asOptionalString(direction);
  if (directionValue && !ALLOWED_DIRECTION.has(directionValue)) {
    return jsonWithSecurity({ ok: false, error: "invalid-direction" }, { status: 400 });
  }

  const metadataValue = asRecord(metadata) || {};

  const { data, error } = await supabase
    .from("lead_interactions")
    .insert([
      {
        lead_id: leadId,
        interaction_type: interactionType,
        status: asOptionalString(status),
        message_preview: asOptionalString(message_preview),
        metadata: metadataValue,
        channel: channelValue,
        provider: asOptionalString(provider),
        provider_message_id: asOptionalString(provider_message_id),
        direction: directionValue,
        template_key: asOptionalString(template_key),
        consent_checked: consent_checked === true,
      },
    ])
    .select()
    .single();

  if (error) {
    return jsonWithSecurity({ ok: false, error: "interaction-log-failed" }, { status: 400 });
  }

  // Auto-update lead status based on interaction
  if (interactionType === "email_sent" && asOptionalString(status) === "sent") {
    await supabase
      .from("leads_landscaping")
      .update({ status: "contacted" })
      .eq("id", leadId);
  }

  if (interactionType === "email_replied" || interactionType === "response_received") {
    await supabase
      .from("leads_landscaping")
      .update({ status: "qualified", responded_at: new Date().toISOString() })
      .eq("id", leadId);
  }

  return jsonWithSecurity(data);
}

async function getDailyStats(supabase: SupabaseClientType) {
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
      .eq("interaction_type", "email_sent");

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

    return jsonWithSecurity({
      date: today,
      leads_sent: sent || 0,
      leads_responded: responded || 0,
      leads_qualified: qualified || 0,
      leads_booked: booked || 0,
    });
  }

  return jsonWithSecurity(stats);
}

async function getCampaignPlan(supabase: SupabaseClientType) {
  const today = new Date();

  const { data: firstRun } = await supabase
    .from("lead_daily_stats")
    .select("date")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const plan = getCampaignPlanForDate(
    today,
    firstRun?.date || today.toISOString().split("T")[0]
  );

  return jsonWithSecurity({
    ...plan,
    schedule: getCampaignPlanSummary(),
  });
}
