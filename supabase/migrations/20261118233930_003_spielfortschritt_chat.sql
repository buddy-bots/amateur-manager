-- Manager-Erfahrung gehört zum Konto (spielübergreifend), schreibt nur der Server
alter table public.profiles add column xp bigint not null default 0;
-- Kennzahlen eines Spielstands für Ranglisten (vom Server geschrieben)
alter table public.saves add column summary jsonb not null default '{}'::jsonb;

-- Chat zwischen Managern (in-game WhatsApp)
create table public.wa_messages (
  id bigint generated always as identity primary key,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index wa_messages_to_idx on public.wa_messages (to_user, created_at);
create index wa_messages_from_idx on public.wa_messages (from_user, created_at);
alter table public.wa_messages enable row level security;
create policy wam_select on public.wa_messages for select to authenticated
  using (from_user = (select auth.uid()) or to_user = (select auth.uid()));
create policy wam_insert on public.wa_messages for insert to authenticated
  with check (from_user = (select auth.uid()));
create policy wam_update on public.wa_messages for update to authenticated
  using (to_user = (select auth.uid())) with check (to_user = (select auth.uid()));
revoke update on public.wa_messages from authenticated;
grant update (read_at) on public.wa_messages to authenticated;
