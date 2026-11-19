-- Ligen in der Admin-Seite pflegen: Import und Namenskorrekturen (name_fix = von Hand geändert, Import überschreibt nicht)
alter table public.ligen_staffeln add column if not exists name_fix boolean not null default false;
alter table public.ligen_teams add column if not exists name_fix boolean not null default false;
create policy ligen_staffeln_admin on public.ligen_staffeln for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy ligen_teams_admin on public.ligen_teams for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
