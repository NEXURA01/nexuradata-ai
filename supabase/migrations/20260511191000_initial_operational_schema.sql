-- NEXURA Supabase baseline schema
-- Mirrors the current operational Postgres schema used by the public intake,
-- operator console, client status flow, and Stripe payment tracking.

CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  support TEXT NOT NULL,
  urgency TEXT NOT NULL,
  message TEXT NOT NULL,
  source_path TEXT NOT NULL DEFAULT '/',
  status TEXT NOT NULL,
  next_step TEXT NOT NULL,
  client_summary TEXT NOT NULL,
  access_code_hash TEXT NOT NULL,
  access_code_ciphertext TEXT NOT NULL DEFAULT '',
  access_code_last_sent_at TEXT NOT NULL DEFAULT '',
  status_email_last_sent_at TEXT NOT NULL DEFAULT '',
  qualification_summary TEXT NOT NULL DEFAULT '',
  internal_notes TEXT NOT NULL DEFAULT '',
  handling_flags TEXT NOT NULL DEFAULT '',
  quote_status TEXT NOT NULL DEFAULT 'none',
  quote_amount_cents INTEGER DEFAULT NULL,
  quote_sent_at TEXT NOT NULL DEFAULT '',
  quote_approved_at TEXT NOT NULL DEFAULT '',
  preapproval_confirmed INTEGER NOT NULL DEFAULT 0,
  acquisition_source TEXT NOT NULL DEFAULT '',
  last_reminder_sent_at TEXT NOT NULL DEFAULT '',
  last_client_contact_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_email ON cases(email);
CREATE INDEX IF NOT EXISTS idx_cases_name ON cases(name);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_quote_status ON cases(quote_status);

CREATE TABLE IF NOT EXISTS case_updates (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'timeline',
  title TEXT NOT NULL,
  note TEXT NOT NULL,
  state TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_updates_case_visible_sort
  ON case_updates(case_id, kind, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_case_updates_case_created
  ON case_updates(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS case_payments (
  id SERIAL PRIMARY KEY,
  payment_request_id TEXT NOT NULL UNIQUE,
  case_id TEXT NOT NULL,
  payment_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  checkout_url TEXT NOT NULL DEFAULT '',
  stripe_checkout_session_id TEXT NOT NULL DEFAULT '',
  stripe_payment_intent_id TEXT NOT NULL DEFAULT '',
  stripe_session_status TEXT NOT NULL DEFAULT '',
  stripe_payment_status TEXT NOT NULL DEFAULT '',
  stripe_customer_email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TEXT NOT NULL DEFAULT '',
  paid_at TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'ops',
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_payments_case_created
  ON case_payments(case_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_case_payments_session
  ON case_payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id <> '';
