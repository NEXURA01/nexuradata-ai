export type CampaignIndustryKey =
  | "landscaping"
  | "window_washing"
  | "moving"
  | "junk_removal"
  | "pressure_washing"
  | "cleaning"
  | "property_maintenance"
  | "handyman"
  | "painting"
  | "roofing";

export type CampaignPlanDay = {
  day: number;
  region: string;
  industries: CampaignIndustryKey[];
  quota: number;
  angle: string;
};

export type LeadContact = {
  id: string;
  name: string;
  business_name: string;
  business_type: string;
  city: string;
  email: string | null;
  phone?: string | null;
  website?: string | null;
  region?: string;
  intent_signal?: string | null;
};

const MAILGUN_API_BASE = "https://api.mailgun.net/v3";

const CAMPAIGN_CYCLE: CampaignPlanDay[] = [
  { day: 1, region: "Montreal", industries: ["landscaping", "window_washing"], quota: 30, angle: "busy crews miss calls" },
  { day: 2, region: "Laval", industries: ["moving", "junk_removal"], quota: 30, angle: "same-day demand" },
  { day: 3, region: "South Shore", industries: ["pressure_washing", "cleaning"], quota: 30, angle: "recurring local service" },
  { day: 4, region: "Quebec City", industries: ["property_maintenance", "handyman"], quota: 30, angle: "maintenance work and estimates" },
  { day: 5, region: "Gatineau", industries: ["roofing", "painting"], quota: 30, angle: "high-ticket estimate flow" },
  { day: 6, region: "Montreal", industries: ["landscaping", "moving"], quota: 30, angle: "booked jobs over brochure traffic" },
  { day: 7, region: "Laval", industries: ["window_washing", "pressure_washing"], quota: 30, angle: "seasonal service demand" },
  { day: 8, region: "Quebec City", industries: ["junk_removal", "cleaning"], quota: 30, angle: "fast-response leads" },
  { day: 9, region: "South Shore", industries: ["property_maintenance", "roofing"], quota: 30, angle: "home and commercial upkeep" },
  { day: 10, region: "Gatineau", industries: ["handyman", "painting"], quota: 30, angle: "estimates and schedule gaps" },
  { day: 11, region: "Montreal", industries: ["landscaping", "cleaning"], quota: 30, angle: "crew utilization" },
  { day: 12, region: "Laval", industries: ["window_washing", "moving"], quota: 30, angle: "quick close opportunities" },
  { day: 13, region: "Quebec City", industries: ["pressure_washing", "junk_removal"], quota: 30, angle: "urgent seasonal work" },
  { day: 14, region: "South Shore", industries: ["property_maintenance", "handyman"], quota: 30, angle: "repeat maintenance revenue" },
  { day: 15, region: "Gatineau", industries: ["roofing", "painting"], quota: 30, angle: "finish strong on high-ticket jobs" },
];

const INDUSTRY_COPY: Record<CampaignIndustryKey, {
  label: string;
  pain: string;
  valueProp: string;
}> = {
  landscaping: {
    label: "Landscaping",
    pain: "Crews miss calls while they are on jobs.",
    valueProp: "More booked estimates without adding more ad spend."
  },
  window_washing: {
    label: "Window Washing",
    pain: "Seasonal demand spikes and replies get buried.",
    valueProp: "Turn urgent demand into scheduled work."
  },
  moving: {
    label: "Moving",
    pain: "Leads are time-sensitive and the first reply wins.",
    valueProp: "Capture more booked moves from people ready to hire now."
  },
  junk_removal: {
    label: "Junk Removal",
    pain: "Same-day requests disappear fast.",
    valueProp: "Fill the truck with more ready-to-book jobs."
  },
  pressure_washing: {
    label: "Pressure Washing",
    pain: "Seasonal urgency creates short buying windows.",
    valueProp: "Convert local demand into estimate requests."
  },
  cleaning: {
    label: "Cleaning",
    pain: "Recurring work is valuable but leads are inconsistent.",
    valueProp: "Build steady bookings from a simple email flow."
  },
  property_maintenance: {
    label: "Property Maintenance",
    pain: "Work is often reactive and missed leads cost margin.",
    valueProp: "Keep the schedule full with higher-intent inquiries."
  },
  handyman: {
    label: "Handyman",
    pain: "Small jobs add up and the inbox gets ignored.",
    valueProp: "Get more estimate requests from nearby property owners."
  },
  painting: {
    label: "Painting",
    pain: "Estimates take time and you need a consistent pipeline.",
    valueProp: "Book more walkthroughs from active buyers."
  },
  roofing: {
    label: "Roofing",
    pain: "High-ticket leads need fast follow-up.",
    valueProp: "Turn inspection demand into qualified calls."
  },
};

const INDUSTRY_EMAIL_SUBJECT: Record<CampaignIndustryKey, string> = {
  landscaping: "More landscaping quotes in {region}?",
  window_washing: "Quick question for your window cleaning schedule in {region}",
  moving: "More moving leads in {region}",
  junk_removal: "More junk removal jobs in {region}",
  pressure_washing: "Need more pressure washing requests in {region}?",
  cleaning: "More cleaning bookings in {region}",
  property_maintenance: "Property maintenance leads in {region}",
  handyman: "More handyman estimate requests in {region}",
  painting: "More painting walkthroughs in {region}",
  roofing: "More roofing estimate calls in {region}",
};

const getIndustryInfo = (industry: CampaignIndustryKey) => INDUSTRY_COPY[industry];

export const getCampaignPlanForDate = (
  today = new Date(),
  campaignStartDate?: string | Date | null
): { active: boolean; day: number | null; plan: CampaignPlanDay | null } => {
  const startDate = campaignStartDate ? new Date(campaignStartDate) : new Date(today);
  const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0 || diffDays >= CAMPAIGN_CYCLE.length) {
    return { active: false, day: null, plan: null };
  }

  const plan = CAMPAIGN_CYCLE[diffDays];

  return {
    active: true,
    day: diffDays + 1,
    plan,
  };
};

const buildPlainTextEmail = ({
  lead,
  region,
  industry,
  bookingUrl,
}: {
  lead: LeadContact;
  region: string;
  industry: CampaignIndustryKey;
  bookingUrl: string;
}) => {
  const industryInfo = getIndustryInfo(industry);
  const firstName = (lead.name || lead.business_name || "there").split(" ")[0];

  return [
    `Hi ${firstName},`,
    "",
    `I’m reaching out because businesses like ${lead.business_name || lead.name} in ${region} often lose opportunities when the inbox gets busy on job sites.`,
    "",
    `We help ${industryInfo.label.toLowerCase()} companies get more booked work with a focused email campaign and a simple booking flow.`,
    `The goal is straightforward: ${industryInfo.valueProp}`,
    "",
    `If this is worth a quick look, you can book a short call here: ${bookingUrl}`,
    "",
    "If it is not a fit, reply once and I will stop reaching out.",
    "",
    "Best,",
    "NEXURA",
  ].join("\n");
};

const buildHtmlEmail = ({
  lead,
  region,
  industry,
  bookingUrl,
}: {
  lead: LeadContact;
  region: string;
  industry: CampaignIndustryKey;
  bookingUrl: string;
}) => {
  const industryInfo = getIndustryInfo(industry);
  const firstName = (lead.name || lead.business_name || "there").split(" ")[0];

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXURA Campaign</title></head>
<body style="margin:0;padding:0;background:#11110f;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#11110f;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#0d0d0b;border:1px solid rgba(232,228,220,0.16);">
        <tr><td style="padding:24px 28px 0;">
          <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.28em;color:#bd7630;text-transform:uppercase;">NEXURA email campaign</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#f4efe4;text-transform:uppercase;">Book more work, not more noise</p>
          <div style="height:1px;background:rgba(232,228,220,0.12);margin:20px 0 0;"></div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#f4efe4;line-height:1.16;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8c4bc;">I’m reaching out because businesses like <strong>${lead.business_name || lead.name}</strong> in <strong>${region}</strong> often lose opportunities when the inbox gets busy on job sites.</p>
          <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8c4bc;">We help <strong>${industryInfo.label.toLowerCase()}</strong> companies get more booked work with a focused email campaign and a simple booking flow.</p>
          <div style="background:rgba(232,228,220,0.05);border-left:2px solid #bd7630;padding:14px 16px;margin:18px 0;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#e8e4dc;"><strong>${industryInfo.pain}</strong><br>${industryInfo.valueProp}</p>
          </div>
          <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8c4bc;">If this is worth a quick look, book a short call here:</p>
          <p style="margin:0 0 18px;"><a href="${bookingUrl}" style="display:inline-block;background:#e8e4dc;color:#0d0d0b;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;padding:11px 22px;border-radius:3px;">Book a quick call →</a></p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8f897f;">If it is not a fit, reply once and I will stop reaching out.</p>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <div style="height:1px;background:rgba(232,228,220,0.12);margin-bottom:16px;"></div>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#6f695f;">NEXURA · Quebec, Canada · <a href="https://nexuradata.ca" style="color:#bd7630;text-decoration:none;">nexuradata.ca</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const getMailgunConfig = () => ({
  apiKey: process.env.MAILGUN_API_KEY || "",
  domain: process.env.MAILGUN_DOMAIN || "",
  from: process.env.MAILGUN_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "NEXURA <noreply@nexuradata.ca>",
  regionByDefault: process.env.MAILGUN_REGION_FALLBACK || "Montreal",
  bookingUrl: process.env.CALENDLY_BOOKING_URL || `${process.env.NEXT_PUBLIC_APP_URL || "https://nexuradata.ca"}/book`,
  tracking: process.env.MAILGUN_TRACKING || "yes",
});

export const buildCampaignEmail = ({
  lead,
  plan,
  industry,
}: {
  lead: LeadContact;
  plan: CampaignPlanDay;
  industry: CampaignIndustryKey;
}) => {
  const config = getMailgunConfig();
  const industryInfo = getIndustryInfo(industry);
  const region = plan.region || lead.region || lead.city || config.regionByDefault;
  const subject = INDUSTRY_EMAIL_SUBJECT[industry].replace("{region}", region);
  const text = buildPlainTextEmail({ lead, region, industry, bookingUrl: config.bookingUrl });
  const html = buildHtmlEmail({ lead, region, industry, bookingUrl: config.bookingUrl });

  return {
    subject,
    text,
    html,
    region,
    industryLabel: industryInfo.label,
    bookingUrl: config.bookingUrl,
  };
};

export const sendMailgunEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const { apiKey, domain, from, tracking } = getMailgunConfig();

  if (!apiKey || !domain) {
    return { success: false, reason: "not-configured" as const };
  }

  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", to);
  body.set("subject", subject);
  body.set("text", text);
  body.set("html", html);
  body.set("o:tracking", tracking);

  const response = await fetch(`${MAILGUN_API_BASE}/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const responseText = await response.text();

  if (!response.ok) {
    return {
      success: false,
      reason: `api-${response.status}` as const,
      error: responseText,
    };
  }

  return {
    success: true,
    id: responseText,
  };
};

export const getCampaignPlanSummary = () => CAMPAIGN_CYCLE.map((day) => ({
  day: day.day,
  region: day.region,
  industries: day.industries,
  quota: day.quota,
  angle: day.angle,
}));
