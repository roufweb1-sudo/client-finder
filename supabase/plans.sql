-- Client Finder: plans, monthly usage and payments (run once in Supabase SQL Editor)

-- Each user's plan. Users can read theirs; only the server (secret key) can change it.
create table if not exists public.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  plan_period text check (plan_period in ('monthly','yearly')),
  plan_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Usage per user per calendar month
create table if not exists public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  searches int not null default 0,
  pitches int not null default 0,
  checks int not null default 0,
  primary key (user_id, month)
);

-- Razorpay payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  plan_period text not null check (plan_period in ('monthly','yearly')),
  amount int not null, -- in paise
  status text not null default 'created' check (status in ('created','paid','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.accounts enable row level security;
alter table public.usage enable row level security;
alter table public.payments enable row level security;

drop policy if exists "own account read" on public.accounts;
drop policy if exists "own usage read" on public.usage;
drop policy if exists "own payments read" on public.payments;
create policy "own account read" on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "own usage read" on public.usage for select to authenticated using ((select auth.uid()) = user_id);
create policy "own payments read" on public.payments for select to authenticated using ((select auth.uid()) = user_id);

-- Logged-in users may only READ these tables
revoke all on public.accounts, public.usage, public.payments from anon, authenticated;
grant select on public.accounts, public.usage, public.payments to authenticated;

-- Atomically use one unit of a monthly allowance. Returns the new count, or -1 if the limit is reached.
create or replace function public.consume_usage(p_user uuid, p_kind text, p_limit int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  m date := date_trunc('month', now() at time zone 'Asia/Kolkata')::date;
  cur int;
begin
  if p_kind not in ('searches','pitches','checks') then raise exception 'bad kind'; end if;
  insert into public.usage (user_id, month) values (p_user, m) on conflict do nothing;
  execute format('select %I from public.usage where user_id = $1 and month = $2 for update', p_kind) into cur using p_user, m;
  if cur >= p_limit then return -1; end if;
  execute format('update public.usage set %I = %I + 1 where user_id = $1 and month = $2', p_kind, p_kind) using p_user, m;
  return cur + 1;
end $$;

-- Give back one unit (when the Google/AI call failed after we counted it)
create or replace function public.refund_usage(p_user uuid, p_kind text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  m date := date_trunc('month', now() at time zone 'Asia/Kolkata')::date;
begin
  if p_kind not in ('searches','pitches','checks') then raise exception 'bad kind'; end if;
  execute format('update public.usage set %I = greatest(%I - 1, 0) where user_id = $1 and month = $2', p_kind, p_kind) using p_user, m;
end $$;

-- Only the server may call these
revoke all on function public.consume_usage(uuid, text, int) from public, anon, authenticated;
revoke all on function public.refund_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_usage(uuid, text, int) to service_role;
grant execute on function public.refund_usage(uuid, text) to service_role;
