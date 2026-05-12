alter table payments
	add column if not exists payment_request_id text,
	add column if not exists ai_estimate_id uuid references ai_estimates(id) on delete set null,
	add column if not exists workflow_case_id uuid references workflow_cases(id) on delete set null,
	add column if not exists customer_email text,
	add column if not exists payment_kind text default 'operational_review',
	add column if not exists currency text default 'cad',
	add column if not exists metadata jsonb default '{}'::jsonb;

create unique index if not exists idx_payments_payment_request_id
	on payments (payment_request_id)
	where payment_request_id is not null;

create index if not exists idx_payments_workflow_case_created
	on payments (workflow_case_id, created_at desc);

create table if not exists workflow_events (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz default now(),
	workflow_case_id uuid references workflow_cases(id) on delete cascade,
	lead_id uuid references leads(id) on delete set null,
	event_type text not null,
	title text not null,
	description text default '',
	metadata jsonb default '{}'::jsonb
);

alter table workflow_events enable row level security;

create index if not exists idx_workflow_events_case_created
	on workflow_events (workflow_case_id, created_at desc);

create unique index if not exists idx_workflow_events_case_type
	on workflow_events (workflow_case_id, event_type)
	where workflow_case_id is not null;

notify pgrst, 'reload schema';
