-- Corrective migration for landscaping leads schema
-- Goal: reduce false duplicates, improve outreach query performance, and ensure one daily stats row per date.

BEGIN;

-- 1) Relax phone uniqueness (too strict for shared business numbers)
ALTER TABLE IF EXISTS leads_landscaping
  DROP CONSTRAINT IF EXISTS leads_landscaping_phone_key;

-- Keep a lookup index on phone for filtering/debugging
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads_landscaping(phone);

-- Add a more realistic dedupe key: same business + city + phone
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_business_city_phone
  ON leads_landscaping (
    COALESCE(LOWER(business_name), ''),
    COALESCE(LOWER(city), ''),
    phone
  )
  WHERE phone IS NOT NULL AND phone <> '';

-- 2) Speed up chronological outreach fetches
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc
  ON leads_landscaping(created_at DESC);

-- 3) Enforce one row per date in daily stats
-- Cleanup existing duplicates first (keep most recently created row per date)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY date
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM lead_daily_stats
)
DELETE FROM lead_daily_stats s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_lead_daily_stats_date
  ON lead_daily_stats(date);

COMMIT;
