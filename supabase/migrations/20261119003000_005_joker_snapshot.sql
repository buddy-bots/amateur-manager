-- Joker: Spielstand vor dem Anpfiff (nur vom Server geschrieben und gelesen)
alter table public.saves add column joker_snap jsonb, add column joker_date text;
-- Spieler sehen den Snapshot nicht: Lesen nur über ausgewählte Spalten
revoke select on public.saves from authenticated;
grant select (id, user_id, mode, engine_version, club_name, league_name, season, version, summary, created_at, updated_at) on public.saves to authenticated;
