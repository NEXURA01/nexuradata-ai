CREATE TABLE IF NOT EXISTS workflow_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  ai_estimate_id uuid REFERENCES ai_estimates(id) ON DELETE SET NULL,
  organization text,
  contact_email text,
  workflow_summary text,
  recommended_solution text,
  current_stage text DEFAULT 'estimate_generated',
  payment_status text DEFAULT 'pending',
  workflow_status text DEFAULT 'pending_activation',
  dashboard_status text DEFAULT 'not_started',
  task_count integer DEFAULT 0,
  automation_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE workflow_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workflow_cases_lead_created
  ON workflow_cases (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_cases_stage_created
  ON workflow_cases (current_stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_cases_payment_status
  ON workflow_cases (payment_status, created_at DESC);

NOTIFY pgrst, 'reload schema';