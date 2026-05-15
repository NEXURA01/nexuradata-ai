# SETUP CHECKLIST - May 15, 2026

## ✅ Current Status
- **Build:** All green ✓ (42 pages, 0 errors)
- **Code:** Complete (lead gen system ready)
- **Database:** Schema created, NOT YET APPLIED
- **API Keys:** NOT YET CONFIGURED
- **Site:** Loads and works, just needs keys

---

## 🎯 DO THIS TOMORROW (4 STEPS - 20 MINUTES TOTAL)

### Step 1: Supabase Login (5 min)
```powershell
cd C:\Users\oblan\nexuradata-site
supabase login
```
- Authenticates with your Supabase account
- Required for next step

### Step 2: Apply Database Schema (2 min)
```powershell
npx supabase db push --linked
```
- Creates 4 lead generation tables
- Adds RLS policies
- Creates indexes
- **VERIFY:** Check Supabase dashboard - should see these tables:
  - `leads_landscaping`
  - `lead_interactions`
  - `lead_conversions`
  - `lead_daily_stats`

### Step 3: Get API Keys & Update `.env.local` (10 min)

**From Google Cloud Console:**
1. Go to https://console.cloud.google.com/
2. Create/select project → "nexuradata" or similar
3. Enable "Places API" and "Maps API"
4. Create API key
5. Copy to `.env.local`: `GOOGLE_PLACES_API_KEY=AIza...`

**From Twilio:**
1. Go to https://www.twilio.com/console
2. Account SID → `.env.local`: `TWILIO_ACCOUNT_SID=AC...`
3. Auth Token → `.env.local`: `TWILIO_AUTH_TOKEN=...`
4. Phone Numbers section → `.env.local`:
   - `TWILIO_WHATSAPP_NUMBER=+1...`
   - `TWILIO_SMS_NUMBER=+1...`

**From Calendly:**
1. Copy your booking link → `.env.local`: `CALENDLY_BOOKING_URL=https://calendly.com/yourname`

**Your `.env.local` should look like:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://amddiekyhrvxnzszugxb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

GOOGLE_PLACES_API_KEY=AIza...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_SMS_NUMBER=+1234567890
CALENDLY_BOOKING_URL=https://calendly.com/your-username

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Restart Dev Server (1 min)
```powershell
# Kill old server (Ctrl+C)
npm run dev
```
✅ **DONE** - Site ready at http://localhost:3000

---

## 📂 Key Files (Reference)

| File | Purpose |
|------|---------|
| `LEAD_GENERATION_GUIDE.md` | Full documentation |
| `IMPLEMENTATION_SUMMARY.md` | Quick reference |
| `.env.example.leads` | Environment template |
| `app/api/leads/route.ts` | Lead CRUD API |
| `app/api/leads/run-daily/route.ts` | Daily automation trigger |
| `components/LeadsDashboard.tsx` | Dashboard UI |
| `supabase/migrations/20260515_landscaping_leads_schema.sql` | DB schema (pending apply) |

---

## 🚀 After Setup Works

1. Visit `/leads` dashboard
2. Click "Start Daily Outreach" to test
3. System will:
   - Source 40-50 leads from Google Maps
   - Send WhatsApp (70%) + SMS (30%)
   - Track responses & conversions
   - Show realtime stats

---

## ⚠️ If Something Goes Wrong

**Database push fails:**
```powershell
# Make sure you're logged in
supabase login
# Then try again
npx supabase db push --linked
```

**API keys not working:**
- Double-check each key is correct
- Restart dev server after editing `.env.local`
- Check for typos in `.env.local`

**Dashboard shows "Configuration Required":**
- All 4 API keys missing or wrong
- Restart dev server after adding keys

---

## 📊 What's Working Now

✅ Main site - all pages load  
✅ Chat widget - functional  
✅ Employee access page - fixed  
✅ Pricing & services - responsive  
✅ Layout - FR/EN text optimized  
✅ Build - 0 errors, 42 pages generated  

**Just waiting on:** API keys + database schema apply

---

## 💾 Git Status
Latest commit: `dca5f39` (Error handling improvements)

All work saved and committed. Nothing lost.

---

**Good to go. Rest up!** 🌙
