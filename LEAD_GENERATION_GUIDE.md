# Lead Generation System - Email Campaign for Hot Service Businesses

## Overview

Automated lead sourcing and outreach system for landscaping, window washing, moving, junk removal, pressure washing, cleaning and related service businesses. The campaign is email-only, region-based, and scheduled across 15 days with 10 industry types.

**Expected Performance:**
- Daily Outreach: 20-30 targeted emails
- Response Rate: depends on region + niche fit
- Daily Qualified Leads: tracked by replies/bookings
- CAC (Cost Acquisition): lower than SMS-first outreach
- Revenue per Booked Lead: depends on service type

## Architecture

```
Google Maps API + public website email extraction
     ↓
Lead Sourcing Service (region + industry)
     ↓
Supabase (leads_landscaping table)
     ↓
Lead Management API
     ↓
Mailgun (email-only outreach)
     ↓
Lead Dashboard (realtime tracking)
```

### Database Schema

**leads_landscaping** - Core lead data
- `id` (UUID): Unique identifier
- `phone` (TEXT, UNIQUE): Contact number
- `name`, `business_name`, `business_type`: Lead info
- `score` (INT 1-10): Qualification score
- `status` (TEXT): Pipeline stage [new → contacted → qualified → booked → archived]
- `contact_channel` (TEXT): email
- `first_contact_at`, `responded_at`, `booked_at`: Timestamps
- `booking_value`, `booking_type`: Revenue tracking
- `intent_signal` (TEXT): Why this lead was qualified
- `source` (TEXT): google_maps, facebook, referral, etc.

**lead_interactions** - Outreach history
- `id`, `lead_id` (FK), `interaction_type` (email_sent, email_replied, response_received)
- `status` (sent, delivered, read, failed)
- `message_preview`: First 100 chars of message
- `metadata` (JSONB): Mailgun message ID + provider details

**lead_conversions** - Revenue pipeline
- `id`, `lead_id` (FK), `funnel_stage`, `timestamp`
- `revenue`, `notes`

**lead_daily_stats** - Daily rollup
- `date`, `leads_sent`, `leads_responded`, `leads_qualified`, `leads_booked`
- `total_revenue`, `avg_score`

## API Routes

### POST /api/leads

**Create Lead**
```json
{
  "action": "create_lead",
  "phone": "+1234567890",
  "name": "John Smith",
  "business_name": "Smith Property Management",
  "business_type": "commercial",
  "property_age_years": 8,
  "address": "123 Main St",
  "city": "Montreal",
  "postal_code": "H1A 1A1",
  "email": "john@example.com",
  "score": 7,
  "intent_signal": "maintenance_due",
  "source": "google_maps"
}
```

Returns: `{ id, phone, name, score, status: "new", created_at }`

**Update Lead Status**
```json
{
  "action": "update_lead_status",
  "lead_id": "uuid-123",
  "status": "qualified",
  "booking_value": 650,
  "booking_type": "landscape_maintenance"
}
```

**Log Interaction**
```json
{
  "action": "log_interaction",
  "lead_id": "uuid-123",
  "interaction_type": "email_sent",
  "status": "sent",
  "message_preview": "Hi John...",
  "metadata": { "mailgun_message_id": "<20260515.abc123@mg.domain>" }
}
```

**Get Daily Stats**
```json
{
  "action": "get_daily_stats"
}
```

Returns: `{ date, leads_sent, leads_responded, leads_qualified, leads_booked }`

## Lead Sourcing Service

**lib/lead-sourcing.ts**

```typescript
// Source leads by region and industry
const leads = await sourceCampaignLeads(["Montreal"], ["landscaping", "window_washing"], 30);

// Insert to Supabase
const insertedIds = await insertLeadsToSupabase(leads);

// Get leads ready for outreach (status=new, score>=6, email present)
const leadsToContact = await getLeadsForOutreach(30, { region: "Montreal", industries: ["landscaping"] });
```

### Scoring Logic

Leads are scored 1-10 based on:
- **Commercial property** (+2): High intent
- **New property** (+2): Maintenance needed
- **Property age >5 years** (+1): Likely overdue maintenance
- **Business rating ≥4.5** (+1): Well-maintained, likely to engage
- **Real estate business** (+1): Easy conversion

Only leads with score ≥6 and a public email are contacted.

## Outreach Service

**lib/outreach.ts**

### Message Templates

**Email (Mailgun, day-based region campaign)**
```
Hi [First Name],

I’m reaching out because businesses like [Business Name] in [Region] often lose opportunities when the inbox gets busy on job sites.

We help [Industry] companies get more booked work with a focused email campaign and a simple booking flow.

If this is worth a quick look, book a short call here: [Booking Link]

If it is not a fit, reply once and I will stop reaching out.

— NEXURA
```

### Sending Sequence

```typescript
const results = await sendOutreachSequence(leads, plan, plan.industries[0]);
// Mailgun email-only
// Region + industry targeting
```

**Response:** `{ sent: 28, failed: 0, results: [...] }`

## Daily Automation Flow

### POST /api/leads/run-daily

Triggers full daily sequence:

1. **Resolve** the 15-day campaign plan from the campaign start date
2. **Source** leads from Google Maps by region + industry
3. **Extract** public emails from business websites / contact pages
4. **Insert** new leads to Supabase (skip duplicates by phone)
5. **Fetch** leads ready for contact (status=new, score≥6, email present)
6. **Send** Mailgun email sequence
7. **Record** daily stats in lead_daily_stats table

**Response:**
```json
{
  "message": "Daily outreach started",
  "campaign": {
    "day": 1,
    "region": "Montreal",
    "industries": ["landscaping", "window_washing"],
    "quota": 30
  },
  "leads_sourced": 42,
  "leads_queued": 30,
  "leads_sent": 28,
  "leads_failed": 0,
  "results": [...]
}
```

## Dashboard

Access real-time metrics at `/leads`:

- **Leads Sent**: Today's outreach count
- **Responses**: Leads who replied
- **Qualified**: Leads ready to book
- **Booked**: Completed conversions
- **Conversion Funnel**: Visual pipeline
- **Control Panel**: Start daily automation
- **Campaign Header**: Current day, region and industries targeted

### Dashboard Features

- 30-second refresh interval
- Live conversion rate calculation
- Manual trigger for daily run
- 15-day campaign tracking

## Setup Instructions

### 1. Environment Variables

Copy `.env.example.leads` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Mailgun
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
MAILGUN_FROM_EMAIL=NEXURA <noreply@your-domain.com>
MAILGUN_TRACKING=yes

# Daily automation auth
LEAD_DAILY_SECRET=...
LEADS_API_KEY=...

# Google Maps
GOOGLE_PLACES_API_KEY=...

# Calendly
CALENDLY_BOOKING_URL=https://calendly.com/your-username

# Campaign start date (optional)
CAMPAIGN_START_DATE=2026-05-15

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Apply Database Schema

```bash
npx supabase db push --linked
```

Applies migration: `supabase/migrations/20260515_landscaping_leads_schema.sql`

Verifies all 4 tables created with proper RLS policies.

### 3. Start Development Server

```bash
npm run dev
```

Access dashboard at `http://localhost:3000/leads`

### 4. Test API Endpoints

**Create test lead:**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_lead",
    "phone": "+15141234567",
    "name": "Test Business",
    "city": "Montreal",
    "score": 8
  }'
```

**Get daily stats:**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{ "action": "get_daily_stats" }'
```

**Start daily run:**
```bash
curl -X POST http://localhost:3000/api/leads/run-daily
```

## Make.com Automation (Optional)

To automate the daily run at 9am:

1. Create Make.com scenario
2. Trigger: **Schedule** (Daily, 9:00 AM EST)
3. Action: **HTTP module** → POST to `/api/leads/run-daily` with optional `x-api-key` header
4. Action: **Tools filter** → continue only when HTTP response status is `200`
5. Action: **Slack/Email module** → notify results (`leads_sent`, `leads_failed`); include `campaign.region` and `campaign.industries` only when the API response contains `campaign`

Import-ready blueprint template:
- `docs/make/lead-campaign-scenario.json`

## Monitoring & Optimization

### Key Metrics to Track

- **Daily Send Volume**: 20-30 targeted emails
- **Email Delivery Rate**: 95%+ (Mailgun logs)
- **Response Rate**: Target 25%
- **Qualified Rate**: 70% of responses
- **Booking Rate**: 30% of qualified
- **Cost per Lead**: <$1 (Google Maps API)
- **CAC**: $20-30

### Optimization Opportunities

1. **Score Tuning**: Adjust scoring weights based on response rates
2. **Message A/B Testing**: Compare email subject/body variants
3. **Time Zone Optimization**: Send at peak engagement hours
4. **City Targeting**: Focus on high-response cities
5. **Intent Signals**: Add more property age/business type signals

## Troubleshooting

**No leads sourced:**
- Check `GOOGLE_PLACES_API_KEY` is valid
- Verify cities are spelled correctly
- Check Google Maps API quota

**Mailgun send fails:**
- Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`
- Check sender domain DNS (SPF/DKIM) is verified in Mailgun
- Verify recipient email is present on the lead record

**High bounce rate:**
- Public emails from websites may be outdated
- Add email verification step
- Prioritize role inboxes (`info@`, `contact@`, `service@`) and remove generic catch-all domains

**Supabase RLS errors:**
- Ensure Service Role key is used (not Publishable key)
- Check RLS policies allow service-role writes
- Verify `lead_id` FKs exist before inserting interactions

## Files Summary

| File | Purpose |
|------|---------|
| `app/api/leads/route.ts` | Main lead CRUD API |
| `app/api/leads/run-daily/route.ts` | Daily automation trigger |
| `app/[locale]/leads/page.tsx` | Dashboard page |
| `components/LeadsDashboard.tsx` | Real-time stats UI |
| `lib/lead-sourcing.ts` | Google Maps sourcing + website email extraction + Supabase insert |
| `lib/email-campaign.ts` | 15-day campaign plan + Mailgun email composer |
| `lib/outreach.ts` | Mailgun email sending |
| `supabase/migrations/20260515_landscaping_leads_schema.sql` | DB schema |
| `.env.example.leads` | Environment template |
| `docs/make/lead-campaign-scenario.json` | Make.com import template |

## Next Steps

1. ✅ Database schema applied
2. ✅ API endpoints created
3. ✅ Lead sourcing service built
4. ✅ Outreach service built
5. ✅ Dashboard created
6. ⏳ **TODO:** Configure Mailgun domain + API key
7. ⏳ **TODO:** Configure Google Maps API
8. ✅ Make.com blueprint added (`docs/make/lead-campaign-scenario.json`)
9. ⏳ **TODO:** Test end-to-end (source → send → track → book)
10. ⏳ **TODO:** Launch daily automation at 9am

