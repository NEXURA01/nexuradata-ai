-- Generic outbound engine schema for multi-vertical operations
-- Compatibility-safe: creates new outbound_* tables without dropping legacy leads_landscaping tables.

BEGIN;

CREATE TABLE IF NOT EXISTS outbound_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT,
  client_id TEXT,
  name TEXT NOT NULL,
  vertical TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'mixed' CHECK (channel IN ('mixed', 'whatsapp', 'sms', 'email', 'phone', 'manual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  daily_cap INT NOT NULL DEFAULT 40 CHECK (daily_cap >= 0),
  quiet_hours_start SMALLINT CHECK (quiet_hours_start IS NULL OR (quiet_hours_start >= 0 AND quiet_hours_start <= 23)),
  quiet_hours_end SMALLINT CHECK (quiet_hours_end IS NULL OR (quiet_hours_end >= 0 AND quiet_hours_end <= 23)),
  owner TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT,
  client_id TEXT,
  campaign_id UUID REFERENCES outbound_campaigns(id) ON DELETE SET NULL,
  vertical TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  name TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  score INT NOT NULL DEFAULT 5 CHECK (score BETWEEN 1 AND 10),
  intent_signal TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_detail TEXT,
  acquisition_channel TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'booked', 'archived', 'followed_up')),
  contact_channel TEXT NOT NULL DEFAULT 'manual' CHECK (contact_channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'implied', 'explicit', 'opted_out', 'do_not_contact')),
  consent_source TEXT,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  opted_out_at TIMESTAMP,
  opt_out_reason TEXT,
  first_contact_at TIMESTAMP,
  last_contact_at TIMESTAMP,
  next_contact_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_type TEXT CHECK (response_type IS NULL OR response_type IN ('positive', 'negative', 'maybe')),
  booked_at TIMESTAMP,
  booking_value NUMERIC,
  booking_type TEXT,
  owner TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (vertical, phone)
);

CREATE TABLE IF NOT EXISTS outbound_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT,
  client_id TEXT,
  lead_id UUID NOT NULL REFERENCES outbound_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outbound_campaigns(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),
  provider TEXT,
  provider_message_id TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'system')),
  template_key TEXT,
  consent_checked BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  message_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT,
  client_id TEXT,
  lead_id UUID NOT NULL REFERENCES outbound_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outbound_campaigns(id) ON DELETE SET NULL,
  funnel_stage TEXT NOT NULL,
  revenue NUMERIC,
  notes TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT,
  client_id TEXT,
  date DATE NOT NULL,
  vertical TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual')),
  leads_sent INT NOT NULL DEFAULT 0,
  leads_responded INT NOT NULL DEFAULT 0,
  leads_qualified INT NOT NULL DEFAULT 0,
  leads_booked INT NOT NULL DEFAULT 0,
  leads_opted_out INT NOT NULL DEFAULT 0,
  messages_failed INT NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  avg_score NUMERIC,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (date, vertical, channel)
);

CREATE INDEX IF NOT EXISTS idx_outbound_campaigns_status ON outbound_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_outbound_campaigns_vertical ON outbound_campaigns(vertical);

CREATE INDEX IF NOT EXISTS idx_outbound_leads_vertical ON outbound_leads(vertical);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_status ON outbound_leads(status);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_consent_status ON outbound_leads(consent_status);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_do_not_contact ON outbound_leads(do_not_contact);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_next_contact_at ON outbound_leads(next_contact_at);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_campaign_id ON outbound_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_email ON outbound_leads(email);

CREATE INDEX IF NOT EXISTS idx_outbound_interactions_lead_id ON outbound_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_outbound_interactions_campaign_id ON outbound_interactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_interactions_provider_message_id ON outbound_interactions(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_outbound_interactions_channel_timestamp ON outbound_interactions(channel, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_outbound_conversions_lead_id ON outbound_conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_outbound_conversions_campaign_id ON outbound_conversions(campaign_id);

CREATE INDEX IF NOT EXISTS idx_outbound_daily_stats_date ON outbound_daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_daily_stats_vertical_channel ON outbound_daily_stats(vertical, channel);

ALTER TABLE outbound_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage outbound campaigns" ON outbound_campaigns
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage outbound leads" ON outbound_leads
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage outbound interactions" ON outbound_interactions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage outbound conversions" ON outbound_conversions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage outbound daily stats" ON outbound_daily_stats
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_outbound_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_outbound_campaigns_updated_at ON outbound_campaigns;
CREATE TRIGGER update_outbound_campaigns_updated_at
BEFORE UPDATE ON outbound_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_outbound_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_outbound_leads_updated_at ON outbound_leads;
CREATE TRIGGER update_outbound_leads_updated_at
BEFORE UPDATE ON outbound_leads
FOR EACH ROW
EXECUTE FUNCTION update_outbound_updated_at_timestamp();

COMMIT;
