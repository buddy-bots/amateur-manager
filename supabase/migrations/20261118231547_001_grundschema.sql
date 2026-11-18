-- Privates Schema für Hilfsfunktionen (nicht über die API erreichbar)
create schema if not exists private;
grant usage on schema private to authenticated;

-- Profile
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_year int check (birth_year between 1900 and 2100),
  terms_accepted_at timestamptz,
  patch_note_accepted_at timestamptz,
  lang text not null default 'de' check (lang in ('de','en','es','fr')),
  bg_key text,
  avatar_path text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false); $$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- is_admin darf der Nutzer nie selbst setzen: Spaltenrechte einschränken
revoke update on public.profiles from authenticated;
grant update (display_name, lang, bg_key, avatar_path, last_seen_at) on public.profiles to authenticated;

-- Spielstände: nur lesen für den Besitzer, schreiben nur der Server (service_role)
create table public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'single' check (mode in ('single','club','multi')),
  engine_version text not null,
  club_name text,
  league_name text,
  season int,
  state jsonb not null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index saves_user_id_idx on public.saves (user_id);
alter table public.saves enable row level security;
create policy saves_select_own on public.saves for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.saves from anon, authenticated;

-- Feedback-Tickets (Entwickler-Chat)
create table public.feedback_tickets (
  id bigint generated always as identity primary key,
  ticket_no int generated always as (1000 + id::int) stored,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 4000),
  answer text,
  answered_at timestamptz,
  answer_read_at timestamptz,
  created_at timestamptz not null default now()
);
create index feedback_user_id_idx on public.feedback_tickets (user_id);
alter table public.feedback_tickets enable row level security;
create policy fb_select on public.feedback_tickets for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy fb_insert_own on public.feedback_tickets for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy fb_update on public.feedback_tickets for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
revoke update on public.feedback_tickets from authenticated;
grant update (answer, answered_at, answer_read_at) on public.feedback_tickets to authenticated;
-- Nur Admin darf antworten; Spieler darf nur "gelesen" setzen
create or replace function private.fb_guard() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() and (new.answer is distinct from old.answer or new.answered_at is distinct from old.answered_at) then
    raise exception 'Nur der Entwickler darf antworten';
  end if;
  if private.is_admin() and new.answer is distinct from old.answer then new.answered_at := now(); end if;
  return new;
end $$;
create trigger fb_guard before update on public.feedback_tickets for each row execute function private.fb_guard();

-- WhatsApp-Favoriten
create table public.wa_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  contact text not null check (char_length(contact) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, contact)
);
alter table public.wa_favorites enable row level security;
create policy waf_all_own on public.wa_favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Bilder-Register: fester Schlüssel -> Datei im Storage
create table public.media (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  path text not null,
  label text,
  updated_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy media_read on public.media for select to anon, authenticated using (true);
create policy media_admin on public.media for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Käufe (für Umsatzstatistik; Einträge schreibt nur der Server)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product text not null,
  mode text not null default 'single' check (mode in ('single','club','multi')),
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null default 'paid',
  provider_ref text unique,
  created_at timestamptz not null default now()
);
create index purchases_user_id_idx on public.purchases (user_id);
alter table public.purchases enable row level security;
create policy purchases_select on public.purchases for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke insert, update, delete on public.purchases from anon, authenticated;

-- Tägliche Logins (Serverzeit) für Belohnung und Statistik
create table public.daily_logins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.daily_logins enable row level security;
create policy dl_select on public.daily_logins for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke insert, update, delete on public.daily_logins from anon, authenticated;

-- Kennzahlen (z. B. Höchststand gleichzeitig online)
create table public.stats (
  key text primary key,
  value bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.stats enable row level security;
create policy stats_admin on public.stats for select to authenticated using ((select private.is_admin()));
revoke insert, update, delete on public.stats from anon, authenticated;
insert into public.stats(key, value) values ('peak_online', 0);

-- Admin-Übersicht als Funktion (nur für Admin)
create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = '' as $$
declare r json;
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  select json_build_object(
    'users_total', (select count(*) from public.profiles),
    'online_now', (select count(*) from public.profiles where last_seen_at > now() - interval '5 minutes'),
    'peak_online', (select value from public.stats where key = 'peak_online'),
    'saves_total', (select count(*) from public.saves),
    'tickets_open', (select count(*) from public.feedback_tickets where answer is null),
    'revenue_cents', (select json_object_agg(mode, total) from (select mode, sum(amount_cents) total from public.purchases where status='paid' group by mode) t)
  ) into r;
  return r;
end $$;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- Profil automatisch anlegen, wenn sich jemand registriert
create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, birth_year, terms_accepted_at, patch_note_accepted_at)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1), 'Manager'), 40),
    nullif(new.raw_user_meta_data->>'birth_year','')::int,
    case when (new.raw_user_meta_data->>'terms') = 'true' then now() end,
    case when (new.raw_user_meta_data->>'patch_note') = 'true' then now() end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
