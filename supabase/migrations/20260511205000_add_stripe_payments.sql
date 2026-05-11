CREATE TABLE IF NOT EXISTS stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE,
  customer_email text,
  amount integer,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_session_id
  ON stripe_payments (stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_status_created
  ON stripe_payments (status, created_at DESC);