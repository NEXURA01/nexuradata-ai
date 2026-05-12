create extension if not exists pgcrypto;

create table if not exists leads (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz default now(),
	company text,
	name text,
	email text,
	problem text,
	tools text,
	teams text,
	status text default 'new'
);

alter table leads
	add column if not exists company text,
	add column if not exists name text,
	add column if not exists problem text,
	add column if not exists tools text,
	add column if not exists teams text;

create table if not exists ai_estimates (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz default now(),
	lead_id uuid references leads(id),
	complexity text,
	recommended_scope text,
	estimated_min_cad integer,
	estimated_max_cad integer,
	summary text,
	raw_result jsonb
);

alter table ai_estimates
	add column if not exists complexity text,
	add column if not exists recommended_scope text,
	add column if not exists estimated_min_cad integer,
	add column if not exists estimated_max_cad integer,
	add column if not exists summary text,
	add column if not exists raw_result jsonb;

alter table leads enable row level security;
alter table ai_estimates enable row level security;

create index if not exists idx_leads_email_created
	on leads (email, created_at desc);

create index if not exists idx_ai_estimates_lead_created
	on ai_estimates (lead_id, created_at desc);

notify pgrst, 'reload schema';
