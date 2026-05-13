create extension if not exists pgcrypto;

alter table public.leads
  add column if not exists company_name text,
  add column if not exists contact_name text,
  add column if not exists problem_description text,
  add column if not exists current_tools text,
  add column if not exists team_count integer,
  add column if not exists urgency text,
  add column if not exists locale text default 'fr',
  add column if not exists ai_estimate jsonb default '{}'::jsonb,
  add column if not exists source_path text,
  add column if not exists source_label text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer text,
  add column if not exists follow_up_consent boolean default true,
  add column if not exists follow_up_stage integer default 0,
  add column if not exists follow_up_next_at timestamptz,
  add column if not exists last_follow_up_sent_at timestamptz,
  add column if not exists last_client_report_sent_at timestamptz,
  add column if not exists lead_score integer default 0;

create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  company text,
  name text,
  role text,
  bottleneck text,
  offer text default 'operational_notes',
  locale text default 'fr',
  source_path text,
  source_label text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  follow_up_consent boolean default true,
  follow_up_stage integer default 0,
  follow_up_next_at timestamptz,
  last_follow_up_sent_at timestamptz,
  status text default 'new'
);

alter table public.lead_captures enable row level security;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subscribed_at timestamptz default now(),
  email text not null unique,
  language text default 'fr',
  status text default 'subscribed',
  metadata jsonb default '{}'::jsonb
);

alter table public.newsletter_subscribers enable row level security;

create index if not exists idx_leads_email_created_at on public.leads (email, created_at desc);
create index if not exists idx_leads_follow_up_due on public.leads (follow_up_next_at) where follow_up_consent = true and status = 'new';
create index if not exists idx_lead_captures_email_created_at on public.lead_captures (email, created_at desc);
create index if not exists idx_lead_captures_follow_up_due on public.lead_captures (follow_up_next_at) where follow_up_consent = true and status = 'new';

notify pgrst, 'reload schema';
