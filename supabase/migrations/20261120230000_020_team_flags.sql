-- Markierungen für eingeladene Nutzer im Admin (Affiliate): Entwicklerteam, Seller, Spieletester
create table if not exists public.team_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dev boolean not null default false,
  seller boolean not null default false,
  tester boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.team_flags enable row level security;
drop policy if exists team_flags_admin on public.team_flags;
create policy team_flags_admin on public.team_flags for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
