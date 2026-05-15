create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
	id uuid primary key default gen_random_uuid(),
	session_token text not null unique,
	locale text not null default 'en' check (locale in ('en', 'fr')),
	first_ip_hash text,
	user_agent text,
	created_at timestamptz not null default now(),
	last_seen_at timestamptz not null default now()
);

create table if not exists public.chat_events (
	id uuid primary key default gen_random_uuid(),
	session_token text references public.chat_sessions(session_token) on delete set null,
	locale text not null default 'en' check (locale in ('en', 'fr')),
	outcome text not null check (outcome in ('accepted', 'rejected')),
	error_code text,
	prompt_preview text,
	message_count integer not null default 0 check (message_count >= 0),
	total_chars integer not null default 0 check (total_chars >= 0),
	ip_hash text,
	user_agent text,
	created_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_last_seen_at
	on public.chat_sessions(last_seen_at desc);

create index if not exists idx_chat_events_created_at
	on public.chat_events(created_at desc);

create index if not exists idx_chat_events_outcome_created_at
	on public.chat_events(outcome, created_at desc);

alter table public.chat_sessions enable row level security;
alter table public.chat_events enable row level security;

revoke all privileges on table public.chat_sessions from anon, authenticated;
revoke all privileges on table public.chat_events from anon, authenticated;

notify pgrst, 'reload schema';
