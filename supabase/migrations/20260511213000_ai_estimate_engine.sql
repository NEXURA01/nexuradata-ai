CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  organization text,
  contact_name text,
  email text,
  workflow_summary text,
  status text DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS ai_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  complexity_score integer,
  orchestration_score integer,
  integration_score integer,
  urgency_score integer,
  estimated_min integer,
  estimated_max integer,
  ai_summary text,
  infrastructure_scope jsonb,
  confidence_score numeric,
  final_status text DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id),
  stripe_session_id text,
  amount integer,
  status text DEFAULT 'pending'
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leads_status_created
  ON leads (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_estimates_lead_created
  ON ai_estimates (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_lead_created
  ON payments (lead_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_session_id
  ON payments (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';