-- Balancing-Auswertung: wöchentlicher Schnappschuss aller Spielstände (Sonntagabend), im Admin als Seite „Balancing“
create table if not exists public.balancing_snapshots (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  data jsonb not null
);
alter table public.balancing_snapshots enable row level security;
drop policy if exists bal_admin on public.balancing_snapshots;
create policy bal_admin on public.balancing_snapshots for select to authenticated using ((select private.is_admin()));

create or replace function private.balancing_compute() returns jsonb language sql security definer set search_path = '' as $$
  with s as (
    select
      (st->>'lvl')::int as lvl,
      coalesce((st->'mcnt'->>'game')::numeric, 0) as g,
      coalesce((st->'mcnt'->>'win')::numeric, 0) as w,
      coalesce((st->'mcnt'->>'draw')::numeric, 0) as d,
      coalesce((st->'mcnt'->>'goal')::numeric, 0) as gf,
      coalesce((st->'mcnt'->>'ga')::numeric, 0) as ga,
      coalesce((st->'mcnt'->>'inst')::numeric, 0) as inst,
      coalesce((st->'mcnt'->>'live')::numeric, 0) as live,
      coalesce((st->'mcnt'->>'event')::numeric, 0) as ev,
      coalesce((st->'mcnt'->>'social')::numeric, 0) + coalesce((st->'mcnt'->>'post')::numeric, 0) as soc,
      coalesce((st->>'cash')::numeric, 0) as cash,
      coalesce((st->>'follow')::numeric, 0) as fol,
      coalesce((st->>'xpGame')::numeric, 0) as xp,
      coalesce((st->>'fans')::numeric, 0) as fans,
      greatest(1, (to_date(st->>'date', 'YYYY-MM-DD') - to_date(st->>'start', 'YYYY-MM-DD'))) as days,
      (select avg((x->>'str')::numeric) from jsonb_array_elements(coalesce(st->'players', '[]'::jsonb)) x) as sq,
      updated_at
    from (select state as st, updated_at from public.saves where state ? 'mcnt') q
  ), act as (select * from s where updated_at > now() - interval '30 days')
  select jsonb_build_object(
    'at', now(),
    'saves', (select count(*) from act),
    'users', (select count(*) from public.profiles),
    'games', (select coalesce(sum(g), 0) from act),
    'win', (select round(100 * sum(w) / nullif(sum(g), 0), 1) from act),
    'draw', (select round(100 * sum(d) / nullif(sum(g), 0), 1) from act),
    'loss', (select round(100 * (sum(g) - sum(w) - sum(d)) / nullif(sum(g), 0), 1) from act),
    'goalsPerGame', (select round(sum(gf) / nullif(sum(g), 0), 2) from act),
    'againstPerGame', (select round(sum(ga) / nullif(sum(g), 0), 2) from act),
    'instShare', (select round(100 * sum(inst) / nullif(sum(inst) + sum(live), 0), 1) from act),
    'eventEveryDays', (select round(sum(days) / nullif(sum(ev), 0), 1) from act),
    'byLvl', (select coalesce(jsonb_agg(x order by x->>'lvl'), '[]'::jsonb) from (
      select jsonb_build_object('lvl', lvl, 'n', count(*), 'games', sum(g), 'win', round(100 * sum(w) / nullif(sum(g), 0), 1),
        'cash', round(avg(cash)), 'fol', round(avg(fol)), 'sq', round(avg(sq), 1), 'fans', round(avg(fans)),
        'xp100', round(avg(xp / days * 100)), 'fol100', round(avg(fol / days * 100)), 'soc100', round(avg(soc / days * 100))) x
      from act group by lvl) t),
    'saveList', (select coalesce(jsonb_agg(jsonb_build_object('lvl', lvl, 'g', g, 'win', round(100 * w / nullif(g, 0)), 'cash', round(cash), 'fol', round(fol), 'days', days)), '[]'::jsonb) from act)
  );
$$;

create or replace function public.admin_balancing() returns setof public.balancing_snapshots language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  return query select * from public.balancing_snapshots order by created_at desc limit 12;
end $$;
create or replace function public.admin_balancing_refresh() returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  insert into public.balancing_snapshots (data) values (private.balancing_compute());
end $$;
revoke all on function public.admin_balancing() from public, anon;
revoke all on function public.admin_balancing_refresh() from public, anon;
grant execute on function public.admin_balancing() to authenticated;
grant execute on function public.admin_balancing_refresh() to authenticated;

create extension if not exists pg_cron;
select cron.unschedule('balancing-weekly') where exists (select 1 from cron.job where jobname = 'balancing-weekly');
-- Sonntag 20:00 Uhr deutscher Zeit (19:00 UTC im Winter)
select cron.schedule('balancing-weekly', '0 19 * * 0', $$insert into public.balancing_snapshots (data) values (private.balancing_compute())$$);
insert into public.balancing_snapshots (data) values (private.balancing_compute());
