-- ChatApp: Freundschaftsanfragen (eine Zeile je Paar, Anfragender = user_id)
create table if not exists public.friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ok')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index if not exists friends_friend_idx on public.friends (friend_id);
alter table public.friends enable row level security;
create policy fr_select on public.friends for select to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));
create policy fr_insert on public.friends for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
    and not exists (select 1 from public.friends f where f.user_id = friends.friend_id and f.friend_id = friends.user_id));
create policy fr_update on public.friends for update to authenticated
  using (friend_id = (select auth.uid())) with check (friend_id = (select auth.uid()) and status = 'ok');
create policy fr_delete on public.friends for delete to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));
revoke update on public.friends from authenticated;
grant update (status) on public.friends to authenticated;

create or replace function private.is_friend(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friends f where f.status = 'ok' and ((f.user_id = a and f.friend_id = b) or (f.user_id = b and f.friend_id = a)));
$$;

-- Chatten nur noch mit bestätigten Favoriten
drop policy if exists wam_insert on public.wa_messages;
create policy wam_insert on public.wa_messages for insert to authenticated
  with check (from_user = (select auth.uid()) and private.is_friend(from_user, to_user));

-- Spieler suchen: Benutzername (Teil) oder E-Mail (nur exakt), E-Mail wird nie zurückgegeben
create or replace function public.find_user(q text)
returns table (id uuid, display_name text, avatar_path text, club_name text, league_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, p.avatar_path, s.club_name, s.league_name
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join lateral (select x.club_name, x.league_name from public.saves x where x.user_id = p.id order by x.updated_at desc limit 1) s on true
  where (select auth.uid()) is not null and p.id <> (select auth.uid()) and p.terms_accepted_at is not null
    and char_length(trim(q)) >= 3
    and (case when position('@' in q) > 0 then lower(u.email) = lower(trim(q)) else p.display_name ilike '%' || replace(replace(trim(q), '%', ''), '_', '') || '%' end)
  order by p.display_name
  limit 10;
$$;
revoke execute on function public.find_user(text) from public, anon;
grant execute on function public.find_user(text) to authenticated;

-- Spielstände, die 3 Monate nicht benutzt wurden, werden täglich gelöscht
create extension if not exists pg_cron;
select cron.schedule('alte-spielstaende-loeschen', '17 3 * * *', $$delete from public.saves where updated_at < now() - interval '3 months'$$);
