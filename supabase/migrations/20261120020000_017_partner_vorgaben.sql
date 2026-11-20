-- Affiliate: Partner-Kennzeichen; Vorgaben (im Admin änderbare Spielwerte)
alter table public.invite_codes add column if not exists partner boolean not null default false;
create table if not exists public.game_config (
  key text primary key check (char_length(key) between 2 and 60),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.game_config enable row level security;
create policy game_config_read on public.game_config for select to anon, authenticated using (true);
create policy game_config_admin on public.game_config for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
