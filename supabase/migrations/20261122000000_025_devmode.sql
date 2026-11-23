-- Entwicklermodus: nur Admin und im Admin markierte Spieler
alter table public.team_flags add column if not exists devmode boolean not null default false;
insert into public.team_flags (user_id, devmode) select id, true from public.profiles where is_admin
  on conflict (user_id) do update set devmode = true, updated_at = now();
