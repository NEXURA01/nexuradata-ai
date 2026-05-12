create extension if not exists pgcrypto;

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	username text unique,
	created_at timestamptz not null default now()
);

create table if not exists public.threads (
	id uuid primary key default gen_random_uuid(),
	title text,
	created_by uuid not null references auth.users(id) on delete cascade,
	created_at timestamptz not null default now()
);

create table if not exists public.thread_participants (
	thread_id uuid not null references public.threads(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	joined_at timestamptz not null default now(),
	primary key (thread_id, user_id)
);

create table if not exists public.messages (
	id uuid primary key default gen_random_uuid(),
	thread_id uuid not null references public.threads(id) on delete cascade,
	author_id uuid not null references auth.users(id) on delete cascade,
	content text not null,
	created_at timestamptz not null default now()
);

create index if not exists idx_thread_participants_user
	on public.thread_participants(user_id);

create index if not exists idx_messages_thread_created
	on public.messages(thread_id, created_at);

create index if not exists idx_messages_author
	on public.messages(author_id);

alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.threads to authenticated;
grant select, insert, delete on public.thread_participants to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "threads_select_if_participant" on public.threads;
drop policy if exists "threads_insert_authenticated" on public.threads;
drop policy if exists "participants_select_own" on public.thread_participants;
drop policy if exists "participants_insert_self" on public.thread_participants;
drop policy if exists "participants_delete_self" on public.thread_participants;
drop policy if exists "messages_select_if_participant" on public.messages;
drop policy if exists "messages_insert_if_participant" on public.messages;
drop policy if exists "messages_update_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "threads_select_if_participant" on public.threads
for select to authenticated
using (exists (
	select 1 from public.thread_participants tp
	where tp.thread_id = threads.id
		and tp.user_id = (select auth.uid())
));

create policy "threads_insert_authenticated" on public.threads
for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "participants_select_own" on public.thread_participants
for select to authenticated
using (user_id = (select auth.uid()));

create policy "participants_insert_self" on public.thread_participants
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "participants_delete_self" on public.thread_participants
for delete to authenticated
using (user_id = (select auth.uid()));

create policy "messages_select_if_participant" on public.messages
for select to authenticated
using (exists (
	select 1 from public.thread_participants tp
	where tp.thread_id = messages.thread_id
		and tp.user_id = (select auth.uid())
));

create policy "messages_insert_if_participant" on public.messages
for insert to authenticated
with check (
	author_id = (select auth.uid())
	and exists (
		select 1 from public.thread_participants tp
		where tp.thread_id = messages.thread_id
			and tp.user_id = (select auth.uid())
	)
);

create policy "messages_update_own" on public.messages
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

create policy "messages_delete_own" on public.messages
for delete to authenticated
using (author_id = (select auth.uid()));

notify pgrst, 'reload schema';
