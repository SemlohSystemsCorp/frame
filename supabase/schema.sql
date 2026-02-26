-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
-- WARNING: Drops and recreates all tables. All data will be lost.

-- =========================================================
-- Drop everything safely (handles fresh DB with no tables)
-- =========================================================

do $$ begin
  drop trigger if exists trg_comment_count on public.comments;
exception when others then null; end $$;

do $$ begin
  drop trigger if exists trg_post_vote_count on public.post_votes;
exception when others then null; end $$;

do $$ begin
  drop trigger if exists trg_post_count on public.posts;
exception when others then null; end $$;

do $$ begin
  drop trigger if exists trg_member_count on public.community_members;
exception when others then null; end $$;

drop function if exists public.update_comment_count() cascade;
drop function if exists public.update_post_vote_count() cascade;
drop function if exists public.update_post_count() cascade;
drop function if exists public.update_member_count() cascade;

drop table if exists public.comments cascade;
drop table if exists public.post_votes cascade;
drop table if exists public.posts cascade;
drop table if exists public.community_members cascade;
drop table if exists public.communities cascade;
drop table if exists public.verification_codes cascade;
drop table if exists public.profiles cascade;

-- =========================================================
-- profiles
-- =========================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  email       text not null unique,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public read"
  on public.profiles for select using (true);

create policy "Own write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================================================
-- verification_codes
-- =========================================================
create table public.verification_codes (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  username      text not null,
  password_hash text not null,
  code          text not null,
  attempts      int  not null default 0,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

alter table public.verification_codes enable row level security;
-- No anon policies — service role only.

-- =========================================================
-- communities
-- =========================================================
create table public.communities (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  display_name text not null,
  description  text,
  avatar_url   text,
  banner_url   text,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  member_count int not null default 1,
  post_count   int not null default 0,
  is_private   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.communities enable row level security;

create policy "Public read"
  on public.communities for select using (true);

create policy "Authenticated create"
  on public.communities for insert
  with check (auth.uid() is not null and auth.uid() = owner_id);

create policy "Owner update"
  on public.communities for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- =========================================================
-- community_members
-- =========================================================
create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

alter table public.community_members enable row level security;

create policy "Public read"
  on public.community_members for select using (true);

create policy "Own write"
  on public.community_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================
-- posts
-- =========================================================
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references public.communities(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  body          text,
  url           text,
  image_url     text,
  flair         text,
  vote_count    int not null default 0,
  comment_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Public read"
  on public.posts for select using (true);

create policy "Members can post"
  on public.posts for insert
  with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.community_members
      where community_id = posts.community_id
        and user_id = auth.uid()
    )
  );

create policy "Own delete"
  on public.posts for delete
  using (auth.uid() = author_id);

-- =========================================================
-- post_votes
-- =========================================================
create table public.post_votes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_votes enable row level security;

create policy "Public read"
  on public.post_votes for select using (true);

create policy "Own write"
  on public.post_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================
-- comments
-- =========================================================
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  body        text not null,
  vote_count  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Public read"
  on public.comments for select using (true);

create policy "Own write"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Own delete"
  on public.comments for delete
  using (auth.uid() = author_id);

-- =========================================================
-- Triggers: keep denormalised counts accurate
-- =========================================================

create or replace function public.update_member_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = NEW.community_id;
  elsif TG_OP = 'DELETE' then
    update public.communities set member_count = greatest(member_count - 1, 0) where id = OLD.community_id;
  end if;
  return null;
end;
$$;

create trigger trg_member_count
  after insert or delete on public.community_members
  for each row execute function public.update_member_count();

create or replace function public.update_post_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.communities set post_count = post_count + 1 where id = NEW.community_id;
  elsif TG_OP = 'DELETE' then
    update public.communities set post_count = greatest(post_count - 1, 0) where id = OLD.community_id;
  end if;
  return null;
end;
$$;

create trigger trg_post_count
  after insert or delete on public.posts
  for each row execute function public.update_post_count();

create or replace function public.update_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_comment_count
  after insert or delete on public.comments
  for each row execute function public.update_comment_count();

create or replace function public.update_post_vote_count()
returns trigger language plpgsql security definer as $$
begin
  update public.posts
  set vote_count = (
    select coalesce(sum(value), 0)
    from public.post_votes
    where post_id = coalesce(NEW.post_id, OLD.post_id)
  )
  where id = coalesce(NEW.post_id, OLD.post_id);
  return null;
end;
$$;

create trigger trg_post_vote_count
  after insert or update or delete on public.post_votes
  for each row execute function public.update_post_vote_count();
