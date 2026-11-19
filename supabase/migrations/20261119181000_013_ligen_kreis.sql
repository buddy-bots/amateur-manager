alter table public.ligen_teams add column if not exists kreis text; create index if not exists ligen_teams_kreis on public.ligen_teams (kreis);
