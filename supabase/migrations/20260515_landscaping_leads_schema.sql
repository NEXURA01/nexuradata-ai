-- Lead sourcing schema for landscaping + window cleaning automation

-- Main leads table
CREATE TABLE IF NOT EXISTS leads_landscaping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT, -- "residential" | "commercial" | "mixed"
  property_age_years INT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  email TEXT,

  -- Lead scoring
  score INT DEFAULT 5, -- 1-10 scale
  intent_signal TEXT, -- "new_property" | "maintenance_due" | "commercial_growth"

  -- Status pipeline
  status TEXT DEFAULT 'new', -- "new" | "contacted" | "qualified" | "booked" | "archived"
  contact_channel TEXT DEFAULT 'whatsapp', -- "whatsapp" | "sms" | "email" | "phone"

  -- Response tracking
  first_contact_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_type TEXT, -- "positive" | "negative" | "maybe" | null

  -- Booking
  booked_at TIMESTAMP,
  booking_value NUMERIC,
  booking_type TEXT, -- "landscaping" | "window_cleaning" | "both"

  -- Metadata
  source TEXT DEFAULT 'google_maps', -- "google_maps" | "linkedin" | "facebook" | "manual"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead interactions log (every contact attempt)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads_landscaping(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- "whatsapp_sent" | "sms_sent" | "call" | "email_sent" | "response_received"
  status TEXT, -- "sent" | "delivered" | "read" | "replied" | "failed"
  message_preview TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- extra data like error_code, delivery_time, etc
);

-- Conversion tracking
CREATE TABLE IF NOT EXISTS lead_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads_landscaping(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL, -- "sent" | "delivered" | "clicked" | "qualified" | "booked" | "closed"
  timestamp TIMESTAMP DEFAULT NOW(),
  revenue NUMERIC,
  notes TEXT
);

-- Daily stats
CREATE TABLE IF NOT EXISTS lead_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  leads_sent INT DEFAULT 0,
  leads_responded INT DEFAULT 0,
  leads_qualified INT DEFAULT 0,
  leads_booked INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads_landscaping(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads_landscaping(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads_landscaping(city);
CREATE INDEX IF NOT EXISTS idx_leads_contact_at ON leads_landscaping(first_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversions_lead ON lead_conversions(lead_id);

-- RLS Policies (if using auth)
ALTER TABLE leads_landscaping ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow service role (Make.com) to insert/update
CREATE POLICY "Service role can manage leads" ON leads_landscaping
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage interactions" ON lead_interactions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage conversions" ON lead_conversions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads_landscaping
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();
