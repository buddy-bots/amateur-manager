-- Events: zeitlich begrenzte Aufgaben mit Preisen, im Admin gepflegt
create table if not exists public.game_events (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  task text not null,
  target int not null default 1,
  tiers jsonb not null default '[]'::jsonb,
  show_from timestamptz not null default now(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.game_events enable row level security;
drop policy if exists gev_read on public.game_events;
create policy gev_read on public.game_events for select to anon, authenticated using (active and show_from <= now() and ends_at > now() - interval '3 days');
drop policy if exists gev_admin on public.game_events;
create policy gev_admin on public.game_events for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
