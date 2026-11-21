-- Freundesliga: Wochenwertung (Mo–So) mit den eigenen Call-Up-Favoriten
create table if not exists public.fl_week (
  user_id uuid not null references auth.users(id) on delete cascade,
  week date not null,
  save_id uuid,
  base jsonb not null default '{}'::jsonb,
  cur jsonb not null default '{}'::jsonb,
  acc int not null default 0,
  pts int not null default 0,
  rank int,
  rewarded boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);
alter table public.fl_week enable row level security;
drop policy if exists flw_own on public.fl_week;
create policy flw_own on public.fl_week for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Tabelle der Woche: ich + meine Favoriten (Favoriten sind als Anzeigenamen gespeichert)
create or replace function public.fl_table(p_week date default null) returns table(user_id uuid, name text, pic text, pts int, cur jsonb, base jsonb, me boolean)
language sql stable security definer set search_path = '' as $$
  with wk as (select coalesce(p_week, (date_trunc('week', (now() at time zone 'Europe/Berlin')))::date) as w),
  ppl as (
    select p.id, p.display_name, p.avatar_path from public.profiles p where p.id = (select auth.uid())
    union
    select p.id, p.display_name, p.avatar_path from public.profiles p join public.wa_favorites f on f.contact = p.display_name and f.user_id = (select auth.uid()) where p.id <> (select auth.uid())
  )
  select ppl.id, ppl.display_name, ppl.avatar_path, coalesce(w.pts, 0), coalesce(w.cur, '{}'::jsonb), coalesce(w.base, '{}'::jsonb), ppl.id = (select auth.uid())
  from ppl left join public.fl_week w on w.user_id = ppl.id and w.week = (select w from wk)
  order by coalesce(w.pts, 0) desc, ppl.display_name;
$$;
revoke all on function public.fl_table(date) from public, anon;
grant execute on function public.fl_table(date) to authenticated;

create or replace function public.fl_admin() returns table(name text, pts int, cur jsonb, base jsonb, week date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  return query select p.display_name, w.pts, w.cur, w.base, w.week from public.fl_week w join public.profiles p on p.id = w.user_id
    where w.week = (date_trunc('week', (now() at time zone 'Europe/Berlin')))::date order by w.pts desc limit 500;
end $$;
revoke all on function public.fl_admin() from public, anon;
grant execute on function public.fl_admin() to authenticated;
