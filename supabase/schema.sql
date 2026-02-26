-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

-- =========================================================
-- profiles
-- =========================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  email       text not null unique,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public read"
  on public.profiles for select
  using (true);

create policy "Own write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================================================
-- verification_codes
-- Stores pending signups until the user enters the code.
-- Deleted automatically after verification or expiry.
-- =========================================================
create table if not exists public.verification_codes (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  username      text not null,
  password_hash text not null,  -- plaintext temporarily; hashed by Supabase auth on createUser
  code          text not null,
  attempts      int  not null default 0,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

-- Only the service role can read/write verification_codes
alter table public.verification_codes enable row level security;

-- Scheduled cleanup: delete expired codes (run via pg_cron or a cron job)
-- select cron.schedule('cleanup-expired-codes', '*/15 * * * *',
--   $$delete from public.verification_codes where expires_at < now()$$);
