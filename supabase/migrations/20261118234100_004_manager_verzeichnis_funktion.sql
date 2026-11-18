-- Manager-Verzeichnis als Funktion: nur unkritische Felder, nur für angemeldete Nutzer
create or replace function public.manager_directory()
returns table (id uuid, display_name text, avatar_path text, xp bigint, last_seen_at timestamptz, club_name text, league_name text, summary jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.avatar_path, p.xp, p.last_seen_at, s.club_name, s.league_name, s.summary
  from public.profiles p
  left join lateral (select x.club_name, x.league_name, x.summary from public.saves x where x.user_id = p.id order by x.updated_at desc limit 1) s on true
  where p.terms_accepted_at is not null and (select auth.uid()) is not null
  order by p.xp desc
  limit 500;
$$;
revoke execute on function public.manager_directory() from public, anon;
grant execute on function public.manager_directory() to authenticated;
