# Lead Generation System - Landscaping & Window Cleaning

## Overview

Automated lead sourcing and outreach system for landscaping/window cleaning services. Targets 40-50 qualified leads/day with 70% WhatsApp + 30% SMS delivery, multi-day cadence sequencing, and real-time conversion tracking.

**Expected Performance:**
- Daily Outreach: 40-50 leads
- Response Rate: 25% qualified leads
- Daily Qualified Leads: 10-12
- CAC (Cost Acquisition): $20-30
- Revenue per Booked Lead: $500-800

## Architecture

```
Google Maps API
     ↓
Lead Sourcing Service (40-50/day)
     ↓
Supabase (leads_landscaping table)
     ↓
Lead Management API
     ↓
Twilio (WhatsApp 70% + SMS 30%)
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
- `contact_channel` (TEXT): WhatsApp or SMS
- `first_contact_at`, `responded_at`, `booked_at`: Timestamps
- `booking_value`, `booking_type`: Revenue tracking
- `intent_signal` (TEXT): Why this lead was qualified
- `source` (TEXT): google_maps, facebook, referral, etc.

**lead_interactions** - Outreach history
- `id`, `lead_id` (FK), `interaction_type` (whatsapp_sent, sms_sent, response_received)
- `status` (sent, delivered, read, failed)
- `message_preview`: First 100 chars of message
- `metadata` (JSONB): Twilio SID, provider details

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
  "interaction_type": "whatsapp_sent",
  "status": "delivered",
  "message_preview": "Salut John...",
  "metadata": { "twilio_sid": "SM123..." }
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
// Source 40-50 leads from Google Maps
const leads = await sourceCitiesLeads(["Montreal", "Quebec City", "Laval"], 40);

// Insert to Supabase
const insertedIds = await insertLeadsToSupabase(leads);

// Get leads ready for outreach (status=new, score>=6)
const leadsToContact = await getLeadsForOutreach(40);
```

### Scoring Logic

Leads are scored 1-10 based on:
- **Commercial property** (+2): High intent
- **New property** (+2): Maintenance needed
- **Property age >5 years** (+1): Likely overdue maintenance
- **Business rating ≥4.5** (+1): Well-maintained, likely to engage
- **Real estate business** (+1): Easy conversion

Only leads with score ≥6 are contacted.

## Outreach Service

**lib/outreach.ts**

### Message Templates

**WhatsApp (Day 0 & 2)**
```
👋 Salut [Name],

Rapide question: Tu délègues actuellement la maintenance de ta propriété?

40% des entrepreneurs disent que c'est leur plus grand time-waster. 
On récupère 3-4h/mois juste avec paysage + vitres.

Ça te parle? → [Calendly]

— NEXURA Team
```

**SMS (Day 4)**
```
Hi [Name], confirm interest or we'll remove you. 
Reply YES or go here: [App URL]/confirm-interest
```

### Sending Sequence

```typescript
const results = await sendOutreachSequence(leads, calendlyUrl);
// 70% WhatsApp, 30% SMS
// Rate limited: 5-6 leads/hour (1 every ~10 seconds)
```

**Response:** `{ sent: 28, failed: 0, results: [...] }`

## Daily Automation Flow

### POST /api/leads/run-daily

Triggers full daily sequence:

1. **Source** 40-50 leads from Google Maps API
2. **Insert** new leads to Supabase (skip duplicates by phone)
3. **Fetch** leads ready for contact (status=new, score≥6)
4. **Send** WhatsApp (70%) + SMS (30%) with rate limiting
5. **Record** daily stats in lead_daily_stats table

**Response:**
```json
{
  "message": "Daily outreach started",
  "leads_sourced": 42,
  "leads_queued": 40,
  "leads_sent": 40,
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

### Dashboard Features

- 30-second refresh interval
- Live conversion rate calculation
- Manual trigger for daily run
- Rate limiting verification (5-6/hour)

## Setup Instructions

### 1. Environment Variables

Copy `.env.example.leads` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_SMS_NUMBER=+1234567890

# Google Maps
GOOGLE_PLACES_API_KEY=...

# Calendly
CALENDLY_BOOKING_URL=https://calendly.com/your-username

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
3. Action: **HTTP module** → POST to `/api/leads/run-daily`
4. Add follow-up steps for Day 2, Day 4, Day 7 sequences

**Day 2 Step** (48 hours later):
```json
{
  "action": "log_interaction",
  "lead_id": "{{lead_id}}",
  "interaction_type": "whatsapp_sent",
  "status": "followup",
  "message_preview": "Salut [Name], regarde ce qu'on fait..."
}
```

## Monitoring & Optimization

### Key Metrics to Track

- **Daily Send Volume**: 40-50 leads
- **WhatsApp Delivery Rate**: 95%+ (Twilio reports)
- **Response Rate**: Target 25%
- **Qualified Rate**: 70% of responses
- **Booking Rate**: 30% of qualified
- **Cost per Lead**: <$1 (Google Maps API)
- **CAC**: $20-30

### Optimization Opportunities

1. **Score Tuning**: Adjust scoring weights based on response rates
2. **Message A/B Testing**: Compare WhatsApp copy variants
3. **Time Zone Optimization**: Send at peak engagement hours
4. **City Targeting**: Focus on high-response cities
5. **Intent Signals**: Add more property age/business type signals

## Troubleshooting

**No leads sourced:**
- Check `GOOGLE_PLACES_API_KEY` is valid
- Verify cities are spelled correctly
- Check Google Maps API quota

**WhatsApp send fails:**
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Check phone number format (+1234567890)
- Ensure WhatsApp is enabled on Twilio account

**High bounce rate:**
- Phone numbers from Google Maps may be outdated
- Add email verification step
- Cross-reference against LinkedIn

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
| `lib/lead-sourcing.ts` | Google Maps sourcing + Supabase insert |
| `lib/outreach.ts` | Twilio WhatsApp/SMS sending |
| `supabase/migrations/20260515_landscaping_leads_schema.sql` | DB schema |
| `.env.example.leads` | Environment template |

## Next Steps

1. ✅ Database schema applied
2. ✅ API endpoints created
3. ✅ Lead sourcing service built
4. ✅ Outreach service built
5. ✅ Dashboard created
6. ⏳ **TODO:** Configure Twilio WhatsApp + SMS
7. ⏳ **TODO:** Configure Google Maps API
8. ⏳ **TODO:** Create Make.com automation workflow
9. ⏳ **TODO:** Test end-to-end (source → send → track → book)
10. ⏳ **TODO:** Launch daily automation at 9am

