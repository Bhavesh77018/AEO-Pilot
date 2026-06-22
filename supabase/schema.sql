-- ============================================================================
--  AEO Pilot — Supabase schema: users + user queries
--  HOW TO RUN:  Supabase Dashboard → SQL Editor → New query → paste → Run.
--  Idempotent & safe to re-run. RLS is ON, so it's safe for a live product.
--
--  What this gives you:
--    • profiles            — your USER LIST (auto-created on signup)
--    • user_queries        — everything users ask / submit, to improve the
--                            product day by day
--    • waitlist            — anonymous email capture for launch
--    • admin_user_overview — one view to manage it all
-- ============================================================================

-- ── 1. PROFILES = the user list (extends Supabase auth.users) ───────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  plan         text not null default 'free',   -- free | growth | agency | enterprise
  role         text not null default 'user',   -- user | admin
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_seen_at timestamptz
);
comment on table public.profiles is 'One row per authenticated user. The user list.';

-- Auto-insert a profile whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill profiles for users who signed up before this trigger existed.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ── 2. USER QUERIES = what users ask / submit (improve the product) ─────────
create table if not exists public.user_queries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  email      text,
  kind       text not null default 'query'
             check (kind in ('query','chat','feedback','bug','feature_request','support')),
  message    text not null,
  context    jsonb not null default '{}'::jsonb,   -- e.g. {"route":"/app","domain":"acme.com"}
  status     text not null default 'new'
             check (status in ('new','reviewed','in_progress','resolved','archived')),
  created_at timestamptz not null default now()
);
comment on table public.user_queries is 'Every user query/feedback — review to improve the product.';
create index if not exists user_queries_user_idx    on public.user_queries (user_id);
create index if not exists user_queries_created_idx on public.user_queries (created_at desc);
create index if not exists user_queries_status_idx  on public.user_queries (status);
create index if not exists user_queries_kind_idx    on public.user_queries (kind);

-- ── 3. WAITLIST / LEADS = anonymous email capture for launch ────────────────
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,                                 -- 'landing' | 'pricing' | ...
  created_at timestamptz not null default now()
);

-- ── 4. ROW LEVEL SECURITY ───────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.user_queries enable row level security;
alter table public.waitlist     enable row level security;

-- Is the current caller an admin? (security definer → no RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: a user sees/edits only their own row; admins see all.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_queries: a user inserts/reads only their own; admins read all.
drop policy if exists "queries_insert_own" on public.user_queries;
create policy "queries_insert_own" on public.user_queries
  for insert with check (auth.uid() = user_id);

drop policy if exists "queries_select_own" on public.user_queries;
create policy "queries_select_own" on public.user_queries
  for select using (auth.uid() = user_id or public.is_admin());

-- waitlist: anyone may join; only admins may read.
drop policy if exists "waitlist_anyone_insert" on public.waitlist;
create policy "waitlist_anyone_insert" on public.waitlist
  for insert with check (true);

drop policy if exists "waitlist_admin_select" on public.waitlist;
create policy "waitlist_admin_select" on public.waitlist
  for select using (public.is_admin());

-- ── 5. ADMIN OVERVIEW — manage everything from one view ─────────────────────
create or replace view public.admin_user_overview
with (security_invoker = true) as
select
  p.id, p.email, p.full_name, p.plan, p.role,
  p.created_at, p.last_seen_at,
  count(q.id)        as total_queries,
  max(q.created_at)  as last_query_at
from public.profiles p
left join public.user_queries q on q.user_id = p.id
group by p.id;

-- ── 6. GRANTS ───────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles     to authenticated;
grant select, insert on public.user_queries to authenticated;
grant insert          on public.waitlist     to anon, authenticated;

-- ── 7. (OPTIONAL) Make yourself an admin — replace the email, then run ──────
-- update public.profiles set role = 'admin' where email = 'you@example.com';

-- ── Handy queries to run later ──────────────────────────────────────────────
-- • All users:            select * from public.admin_user_overview order by created_at desc;
-- • Latest user queries:  select email, kind, message, created_at
--                         from public.user_queries order by created_at desc limit 100;
-- • Top feature requests: select message, count(*) from public.user_queries
--                         where kind = 'feature_request' group by message order by 2 desc;
