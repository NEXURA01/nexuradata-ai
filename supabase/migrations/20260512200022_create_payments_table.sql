CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS payments (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
	ai_estimate_id uuid REFERENCES ai_estimates(id) ON DELETE SET NULL,
	workflow_case_id uuid REFERENCES workflow_cases(id) ON DELETE SET NULL,
	payment_request_id text,
	stripe_session_id text,
	customer_email text,
	amount integer,
	status text DEFAULT 'pending',
	payment_kind text DEFAULT 'operational_review',
	currency text DEFAULT 'cad',
	metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE payments
	ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
	ADD COLUMN IF NOT EXISTS ai_estimate_id uuid REFERENCES ai_estimates(id) ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS workflow_case_id uuid REFERENCES workflow_cases(id) ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS payment_request_id text,
	ADD COLUMN IF NOT EXISTS customer_email text,
	ADD COLUMN IF NOT EXISTS payment_kind text DEFAULT 'operational_review',
	ADD COLUMN IF NOT EXISTS currency text DEFAULT 'cad',
	ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_lead_created
	ON payments (lead_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_session_id
	ON payments (stripe_session_id)
	WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_request_id
	ON payments (payment_request_id)
	WHERE payment_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_workflow_case_created
	ON payments (workflow_case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
	ON payments (status, created_at DESC);

NOTIFY pgrst, 'reload schema';
