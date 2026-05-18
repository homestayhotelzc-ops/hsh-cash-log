-- ============================================================
-- Home Stay Hotel — Auth & Role-Based Access
-- Run this in your Supabase SQL editor (once, in order).
-- ============================================================


-- ── 1. profiles table ────────────────────────────────────────
--   Mirrors auth.users with an added `role` column.
--   Every user gets a profile row on first login (via trigger).

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  role        text        not null default 'front_desk'
                          check (role in ('manager', 'front_desk', 'housekeeping')),
  created_at  timestamptz not null default now()
);

comment on table  public.profiles             is 'One row per auth user. Role controls access.';
comment on column public.profiles.role        is 'manager | front_desk | housekeeping';


-- ── 2. Auto-create profile on new signup ─────────────────────
--   Pulls full_name and role from the user metadata set at
--   invitation / sign-up time.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'front_desk')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 3. Helper: get_my_role() ─────────────────────────────────
--   Security definer so it bypasses RLS on profiles — prevents
--   infinite recursion when RLS policies themselves call it.

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;


-- ── 4. Audit columns on cash_entries ─────────────────────────

alter table public.cash_entries
  add column if not exists created_by_user_id  uuid  references auth.users(id),
  add column if not exists created_by_name     text,
  add column if not exists created_by_role     text;


-- ── 5. Audit columns on expenses ─────────────────────────────

alter table public.expenses
  add column if not exists created_by_user_id  uuid  references auth.users(id),
  add column if not exists created_by_name     text,
  add column if not exists created_by_role     text;


-- ── 6. Enable Row Level Security ─────────────────────────────

alter table public.profiles         enable row level security;
alter table public.cash_entries      enable row level security;
alter table public.expenses          enable row level security;
alter table public.opening_cash      enable row level security;
alter table public.voided_entries    enable row level security;
alter table public.voided_expenses   enable row level security;
alter table public.staff             enable row level security;


-- ── 7. RLS policies: profiles ────────────────────────────────

drop policy if exists "profiles_select"  on public.profiles;
drop policy if exists "profiles_update"  on public.profiles;

-- Any authenticated user can read all profiles (needed for Staff page)
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- ── 8. RLS policies: cash_entries ────────────────────────────

drop policy if exists "entries_select"  on public.cash_entries;
drop policy if exists "entries_insert"  on public.cash_entries;
drop policy if exists "entries_update"  on public.cash_entries;

-- Managers see everything; others see only their own entries
create policy "entries_select"
  on public.cash_entries for select
  to authenticated
  using (
    public.get_my_role() = 'manager'
    or created_by_user_id = auth.uid()
  );

-- Any authenticated user (manager / front_desk) can insert
create policy "entries_insert"
  on public.cash_entries for insert
  to authenticated
  with check (true);

-- Only managers can update (for void status changes)
create policy "entries_update"
  on public.cash_entries for update
  to authenticated
  using (public.get_my_role() = 'manager');


-- ── 9. RLS policies: expenses ────────────────────────────────

drop policy if exists "expenses_select"  on public.expenses;
drop policy if exists "expenses_insert"  on public.expenses;
drop policy if exists "expenses_update"  on public.expenses;

create policy "expenses_select"
  on public.expenses for select
  to authenticated
  using (
    public.get_my_role() = 'manager'
    or created_by_user_id = auth.uid()
  );

create policy "expenses_insert"
  on public.expenses for insert
  to authenticated
  with check (true);

create policy "expenses_update"
  on public.expenses for update
  to authenticated
  using (public.get_my_role() = 'manager');


-- ── 10. RLS policies: opening_cash ───────────────────────────

drop policy if exists "opening_select"  on public.opening_cash;
drop policy if exists "opening_upsert"  on public.opening_cash;

-- All authenticated users can read opening cash (needed for Dashboard)
create policy "opening_select"
  on public.opening_cash for select
  to authenticated
  using (true);

-- Only managers can set / update opening cash
create policy "opening_upsert"
  on public.opening_cash for insert
  to authenticated
  with check (public.get_my_role() = 'manager');

create policy "opening_update"
  on public.opening_cash for update
  to authenticated
  using (public.get_my_role() = 'manager');


-- ── 11. RLS policies: voided_entries / voided_expenses ───────

drop policy if exists "voided_entries_select"  on public.voided_entries;
drop policy if exists "voided_entries_insert"  on public.voided_entries;
drop policy if exists "voided_expenses_select" on public.voided_expenses;
drop policy if exists "voided_expenses_insert" on public.voided_expenses;

create policy "voided_entries_select"
  on public.voided_entries for select
  to authenticated
  using (public.get_my_role() = 'manager');

create policy "voided_entries_insert"
  on public.voided_entries for insert
  to authenticated
  with check (public.get_my_role() = 'manager');

create policy "voided_expenses_select"
  on public.voided_expenses for select
  to authenticated
  using (public.get_my_role() = 'manager');

create policy "voided_expenses_insert"
  on public.voided_expenses for insert
  to authenticated
  with check (public.get_my_role() = 'manager');


-- ── 12. RLS policies: staff (legacy table) ───────────────────

drop policy if exists "staff_select"  on public.staff;

-- Read-only for authenticated users (used for backward-compat display)
create policy "staff_select"
  on public.staff for select
  to authenticated
  using (true);


-- ── 13. Realtime publication ─────────────────────────────────
--   Ensure profiles changes are broadcast to connected clients.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;


-- ── 14. Create your first manager account ────────────────────
--   After creating a user in Supabase Auth dashboard, run:
--
--   update public.profiles
--   set role = 'manager'
--   where id = '<user-uuid>';
--
--   Or set role in user metadata when inviting:
--   { "full_name": "Maria Santos", "role": "manager" }
-- ============================================================
