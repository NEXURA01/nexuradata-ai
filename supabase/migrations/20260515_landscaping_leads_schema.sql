-- Outbound lead engine schema (vertical-agnostic), keeping existing table names for compatibility

-- Main leads table
CREATE TABLE IF NOT EXISTS leads_landscaping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  vertical TEXT NOT NULL DEFAULT 'landscaping',
  property_age_years INT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  email TEXT,

  -- Lead scoring
  score INT DEFAULT 5 CHECK (score >= 1 AND score <= 10),
  intent_signal TEXT,

  -- Status pipeline
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'booked', 'archived', 'followed_up')),
  contact_channel TEXT NOT NULL DEFAULT 'email' CHECK (contact_channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),

  -- Consent and controls
  consent_status TEXT,
  consent_source TEXT,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  opted_out_at TIMESTAMP,
  opt_out_reason TEXT,

  -- Contact scheduling
  first_contact_at TIMESTAMP,
  last_contact_at TIMESTAMP,
  next_contact_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_type TEXT CHECK (response_type IS NULL OR response_type IN ('positive', 'negative', 'maybe')),

  -- Booking
  booked_at TIMESTAMP,
  booking_value NUMERIC,
  booking_type TEXT,

  -- Metadata
  source TEXT DEFAULT 'google_maps',
  source_detail TEXT,
  acquisition_channel TEXT,
  owner TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Realistic dedupe keys
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads_landscaping(phone);
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_business_city_phone
  ON leads_landscaping (
    COALESCE(LOWER(business_name), ''),
    COALESCE(LOWER(city), ''),
    phone
  )
  WHERE phone IS NOT NULL AND phone <> '';

-- Lead interactions log (every contact attempt)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads_landscaping(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  channel TEXT CHECK (channel IS NULL OR channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),
  provider TEXT,
  provider_message_id TEXT,
  direction TEXT CHECK (direction IS NULL OR direction IN ('outbound', 'inbound', 'system')),
  template_key TEXT,
  consent_checked BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  message_preview TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Conversion tracking
CREATE TABLE IF NOT EXISTS lead_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads_landscaping(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  revenue NUMERIC,
  notes TEXT
);

-- Daily stats (by date + vertical + channel)
CREATE TABLE IF NOT EXISTS lead_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  vertical TEXT DEFAULT 'landscaping',
  channel TEXT CHECK (channel IS NULL OR channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),
  leads_sent INT DEFAULT 0,
  leads_responded INT DEFAULT 0,
  leads_qualified INT DEFAULT 0,
  leads_booked INT DEFAULT 0,
  leads_opted_out INT DEFAULT 0,
  messages_failed INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads_landscaping(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads_landscaping(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads_landscaping(city);
CREATE INDEX IF NOT EXISTS idx_leads_vertical ON leads_landscaping(vertical);
CREATE INDEX IF NOT EXISTS idx_leads_do_not_contact ON leads_landscaping(do_not_contact);
CREATE INDEX IF NOT EXISTS idx_leads_contact_at ON leads_landscaping(first_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON leads_landscaping(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_contact_at ON leads_landscaping(next_contact_at);

CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON lead_interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_provider_message_id ON lead_interactions(provider_message_id);

CREATE INDEX IF NOT EXISTS idx_conversions_lead ON lead_conversions(lead_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_lead_daily_stats_date_vertical_channel
  ON lead_daily_stats (
    date,
    COALESCE(vertical, ''),
    COALESCE(channel, '')
  );

-- RLS Policies
ALTER TABLE leads_landscaping ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage leads" ON leads_landscaping;
CREATE POLICY "Service role can manage leads" ON leads_landscaping
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage interactions" ON lead_interactions;
CREATE POLICY "Service role can manage interactions" ON lead_interactions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage conversions" ON lead_conversions;
CREATE POLICY "Service role can manage conversions" ON lead_conversions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage daily stats" ON lead_daily_stats;
CREATE POLICY "Service role can manage daily stats" ON lead_daily_stats
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

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads_landscaping;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads_landscaping
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();
