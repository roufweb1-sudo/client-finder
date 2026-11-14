-- Client Finder database (run once in Supabase SQL Editor)

-- Saved leads: one row per business per user
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null,
  business jsonb not null,
  site_check jsonb,
  status text not null default 'New' check (status in ('New','Contacted','Replied','Won','Lost')),
  follow_up date,
  notes text not null default '',
  search_query text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index if not exists leads_user_idx on public.leads (user_id, created_at desc);

-- Freelancer branding shown on pitches and reports
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '',
  brand text not null default '',
  phone text not null default '',
  email text not null default '',
  logo text not null default '',
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user sees and changes only their own rows
alter table public.leads enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "own leads select" on public.leads;
drop policy if exists "own leads insert" on public.leads;
drop policy if exists "own leads update" on public.leads;
drop policy if exists "own leads delete" on public.leads;
create policy "own leads select" on public.leads for select to authenticated using ((select auth.uid()) = user_id);
create policy "own leads insert" on public.leads for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own leads update" on public.leads for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own leads delete" on public.leads for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Nobody who isn't logged in can touch these tables
revoke all on public.leads from anon;
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
