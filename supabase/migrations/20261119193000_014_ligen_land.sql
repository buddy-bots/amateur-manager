alter table public.ligen_teams add column if not exists land text; create index if not exists ligen_teams_land on public.ligen_teams (land);
