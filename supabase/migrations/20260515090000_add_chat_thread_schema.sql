create extension if not exists pgcrypto;

create table if not exists public.chat_users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_thread_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.thread_summaries (
  thread_id uuid primary key references public.chat_threads(id) on delete cascade,
  summary text not null,
  message_count integer not null default 0 check (message_count >= 0),
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_chat_threads_created_by_created_at
  on public.chat_threads(created_by, created_at desc);

create index if not exists idx_chat_thread_members_user
  on public.chat_thread_members(user_id);

create index if not exists idx_chat_messages_thread_created
  on public.chat_messages(thread_id, created_at);

create index if not exists idx_chat_messages_sender_created
  on public.chat_messages(sender_id, created_at desc);

alter table public.chat_users enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_thread_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.thread_summaries enable row level security;

grant select, insert, update on public.chat_users to authenticated;
grant select, insert on public.chat_threads to authenticated;
grant select, insert, delete on public.chat_thread_members to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select on public.thread_summaries to authenticated;

drop policy if exists "chat_users_select_own" on public.chat_users;
drop policy if exists "chat_users_insert_own" on public.chat_users;
drop policy if exists "chat_users_update_own" on public.chat_users;
drop policy if exists "chat_threads_select_member_or_owner" on public.chat_threads;
drop policy if exists "chat_threads_insert_owner" on public.chat_threads;
drop policy if exists "chat_thread_members_select_visible" on public.chat_thread_members;
drop policy if exists "chat_thread_members_insert_by_member_or_owner" on public.chat_thread_members;
drop policy if exists "chat_thread_members_delete_own" on public.chat_thread_members;
drop policy if exists "chat_messages_select_if_member" on public.chat_messages;
drop policy if exists "chat_messages_insert_if_member" on public.chat_messages;
drop policy if exists "thread_summaries_select_if_member" on public.thread_summaries;

create policy "chat_users_select_own" on public.chat_users
for select to authenticated
using (id = auth.uid());

create policy "chat_users_insert_own" on public.chat_users
for insert to authenticated
with check (id = auth.uid());

create policy "chat_users_update_own" on public.chat_users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "chat_threads_select_member_or_owner" on public.chat_threads
for select to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_threads.id
      and m.user_id = auth.uid()
  )
);

create policy "chat_threads_insert_owner" on public.chat_threads
for insert to authenticated
with check (created_by = auth.uid());

create policy "chat_thread_members_select_visible" on public.chat_thread_members
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.chat_thread_members mine
    where mine.thread_id = chat_thread_members.thread_id
      and mine.user_id = auth.uid()
  )
);

create policy "chat_thread_members_insert_by_member_or_owner" on public.chat_thread_members
for insert to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.chat_threads t
    where t.id = chat_thread_members.thread_id
      and t.created_by = auth.uid()
  )
);

create policy "chat_thread_members_delete_own" on public.chat_thread_members
for delete to authenticated
using (user_id = auth.uid());

create policy "chat_messages_select_if_member" on public.chat_messages
for select to authenticated
using (
  exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and m.user_id = auth.uid()
  )
);

create policy "chat_messages_insert_if_member" on public.chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and m.user_id = auth.uid()
  )
);

create policy "thread_summaries_select_if_member" on public.thread_summaries
for select to authenticated
using (
  exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = thread_summaries.thread_id
      and m.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
