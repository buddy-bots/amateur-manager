-- Freundesliga: Favoriten sind die bestätigten Freundschaften (friends, status ok) – nicht wa_favorites
create or replace function public.fl_table(p_week date default null) returns table(user_id uuid, name text, pic text, pts int, cur jsonb, base jsonb, me boolean)
language sql stable security definer set search_path = '' as $$
  with wk as (select coalesce(p_week, (date_trunc('week', (now() at time zone 'Europe/Berlin')))::date) as w),
  fr as (
    select case when f.user_id = (select auth.uid()) then f.friend_id else f.user_id end as id
    from public.friends f where f.status = 'ok' and (f.user_id = (select auth.uid()) or f.friend_id = (select auth.uid()))
  ),
  ppl as (
    select p.id, p.display_name, p.avatar_path from public.profiles p where p.id = (select auth.uid())
    union
    select p.id, p.display_name, p.avatar_path from public.profiles p join fr on fr.id = p.id where p.id <> (select auth.uid())
  )
  select ppl.id, ppl.display_name, ppl.avatar_path, coalesce(w.pts, 0), coalesce(w.cur, '{}'::jsonb), coalesce(w.base, '{}'::jsonb), ppl.id = (select auth.uid())
  from ppl left join public.fl_week w on w.user_id = ppl.id and w.week = (select w from wk)
  order by coalesce(w.pts, 0) desc, ppl.display_name;
$$;
