-- Phase 1: outbound engine generalization without breaking existing tables

BEGIN;

-- 1) Generic lead controls and metadata on existing table
ALTER TABLE IF EXISTS leads_landscaping
  ADD COLUMN IF NOT EXISTS vertical TEXT,
  ADD COLUMN IF NOT EXISTS source_detail TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_channel TEXT,
  ADD COLUMN IF NOT EXISTS consent_status TEXT,
  ADD COLUMN IF NOT EXISTS consent_source TEXT,
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS opt_out_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE leads_landscaping
SET vertical = COALESCE(NULLIF(vertical, ''), business_type, 'landscaping')
WHERE vertical IS NULL OR vertical = '';

ALTER TABLE IF EXISTS leads_landscaping
  ALTER COLUMN vertical SET DEFAULT 'landscaping';

ALTER TABLE IF EXISTS leads_landscaping
  DROP CONSTRAINT IF EXISTS leads_landscaping_status_check;

ALTER TABLE IF EXISTS leads_landscaping
  ADD CONSTRAINT leads_landscaping_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'booked', 'archived', 'followed_up'));

ALTER TABLE IF EXISTS leads_landscaping
  DROP CONSTRAINT IF EXISTS leads_landscaping_contact_channel_check;

ALTER TABLE IF EXISTS leads_landscaping
  ADD CONSTRAINT leads_landscaping_contact_channel_check
  CHECK (contact_channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual'));

CREATE INDEX IF NOT EXISTS idx_leads_vertical ON leads_landscaping(vertical);
CREATE INDEX IF NOT EXISTS idx_leads_do_not_contact ON leads_landscaping(do_not_contact);
CREATE INDEX IF NOT EXISTS idx_leads_consent_status ON leads_landscaping(consent_status);
CREATE INDEX IF NOT EXISTS idx_leads_next_contact_at ON leads_landscaping(next_contact_at);

-- 2) Interaction auditability extensions
ALTER TABLE IF EXISTS lead_interactions
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS direction TEXT,
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS consent_checked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS lead_interactions
  DROP CONSTRAINT IF EXISTS lead_interactions_channel_check;

ALTER TABLE IF EXISTS lead_interactions
  ADD CONSTRAINT lead_interactions_channel_check
  CHECK (channel IS NULL OR channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual'));

ALTER TABLE IF EXISTS lead_interactions
  DROP CONSTRAINT IF EXISTS lead_interactions_direction_check;

ALTER TABLE IF EXISTS lead_interactions
  ADD CONSTRAINT lead_interactions_direction_check
  CHECK (direction IS NULL OR direction IN ('outbound', 'inbound', 'system'));

CREATE INDEX IF NOT EXISTS idx_interactions_provider_message_id ON lead_interactions(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON lead_interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_direction ON lead_interactions(direction);

-- 3) Stats by vertical/channel
ALTER TABLE IF EXISTS lead_daily_stats
  ADD COLUMN IF NOT EXISTS vertical TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS leads_opted_out INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_failed INT NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS lead_daily_stats
  ALTER COLUMN vertical SET DEFAULT 'landscaping';

ALTER TABLE IF EXISTS lead_daily_stats
  DROP CONSTRAINT IF EXISTS lead_daily_stats_channel_check;

ALTER TABLE IF EXISTS lead_daily_stats
  ADD CONSTRAINT lead_daily_stats_channel_check
  CHECK (channel IS NULL OR channel IN ('whatsapp', 'sms', 'email', 'phone', 'manual'));

DROP INDEX IF EXISTS ux_lead_daily_stats_date;

CREATE UNIQUE INDEX IF NOT EXISTS ux_lead_daily_stats_date_vertical_channel
  ON lead_daily_stats (
    date,
    COALESCE(vertical, ''),
    COALESCE(channel, '')
  );

COMMIT;
