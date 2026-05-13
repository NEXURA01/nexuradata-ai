create extension if not exists pgcrypto;

alter table leads
	add column if not exists company_name text,
	add column if not exists contact_name text,
	add column if not exists problem_description text,
	add column if not exists current_tools text,
	add column if not exists team_count integer,
	add column if not exists urgency text,
	add column if not exists locale text default 'fr',
	add column if not exists ai_estimate jsonb default '{}'::jsonb,
	add column if not exists source_path text default '',
	add column if not exists source_label text default '',
	add column if not exists utm_source text default '',
	add column if not exists utm_medium text default '',
	add column if not exists utm_campaign text default '',
	add column if not exists referrer text default '',
	add column if not exists follow_up_consent boolean default true,
	add column if not exists follow_up_stage integer default 0,
	add column if not exists follow_up_next_at timestamptz,
	add column if not exists last_follow_up_sent_at timestamptz,
	add column if not exists last_client_report_sent_at timestamptz,
	add column if not exists lead_score integer default 0;

create table if not exists lead_captures (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	email text not null,
	company text default '',
	name text default '',
	role text default '',
	bottleneck text default '',
	offer text not null default 'operational_notes',
	locale text not null default 'fr',
	source_path text default '',
	source_label text default '',
	utm_source text default '',
	utm_medium text default '',
	utm_campaign text default '',
	referrer text default '',
	follow_up_consent boolean not null default true,
	status text not null default 'new',
	follow_up_stage integer not null default 0,
	follow_up_next_at timestamptz,
	last_follow_up_sent_at timestamptz
);

alter table lead_captures enable row level security;

create index if not exists idx_lead_captures_email_created
	on lead_captures (email, created_at desc);

create index if not exists idx_lead_captures_follow_up_due
	on lead_captures (follow_up_next_at, follow_up_stage)
	where follow_up_consent = true and status = 'new';

create index if not exists idx_leads_follow_up_due
	on leads (follow_up_next_at, follow_up_stage)
	where follow_up_consent = true and status = 'new';

notify pgrst, 'reload schema';
