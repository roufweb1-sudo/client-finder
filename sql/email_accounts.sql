-- Mailboxes users have connected so the app can send their pitches for them.
-- The refresh token is encrypted by the app before it ever reaches this table,
-- and only the server (service_role) may touch any of it.

create table if not exists public.email_accounts (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  provider      text        not null default 'gmail',
  address       text        not null default '',
  refresh_token text        not null,
  connected_at  timestamptz not null default now()
);

alter table public.email_accounts enable row level security;

-- No policies for anon or authenticated on purpose: with RLS on and no policy,
-- the browser can read nothing here, whatever key it holds. The server uses the
-- secret key, which bypasses RLS.
revoke all on public.email_accounts from anon, authenticated;
