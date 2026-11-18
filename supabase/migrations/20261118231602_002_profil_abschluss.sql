-- Profil vervollständigen (z. B. nach Google-Login): Alter ab 16, AGB und Patch-Hinweis
create or replace function public.complete_profile(p_display_name text, p_birth_year int, p_terms boolean, p_patch_note boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare age int := extract(year from now())::int - p_birth_year;
begin
  if (select auth.uid()) is null then raise exception 'not logged in'; end if;
  if p_birth_year is null or age < 16 or age > 110 then raise exception 'Mindestalter 16 Jahre'; end if;
  if not coalesce(p_terms, false) or not coalesce(p_patch_note, false) then raise exception 'Zustimmung fehlt'; end if;
  if char_length(trim(p_display_name)) < 2 or char_length(trim(p_display_name)) > 40 then raise exception 'Name 2-40 Zeichen'; end if;
  update public.profiles set display_name = trim(p_display_name), birth_year = p_birth_year,
    terms_accepted_at = coalesce(terms_accepted_at, now()), patch_note_accepted_at = coalesce(patch_note_accepted_at, now())
  where id = (select auth.uid());
end $$;
revoke execute on function public.complete_profile(text,int,boolean,boolean) from public, anon;
grant execute on function public.complete_profile(text,int,boolean,boolean) to authenticated;

-- Anzeigename beim Anlegen absichern (mind. 2 Zeichen)
create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare nm text := left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1), 'Manager'), 40);
begin
  if char_length(nm) < 2 then nm := 'Manager'; end if;
  insert into public.profiles (id, display_name) values (new.id, nm);
  return new;
end $$;

-- Herzschlag: zuletzt online + Höchststand gleichzeitig online
create or replace function public.heartbeat() returns void language plpgsql security definer set search_path = '' as $$
declare n bigint;
begin
  if (select auth.uid()) is null then return; end if;
  update public.profiles set last_seen_at = now() where id = (select auth.uid());
  select count(*) into n from public.profiles where last_seen_at > now() - interval '5 minutes';
  update public.stats set value = n, updated_at = now() where key = 'peak_online' and value < n;
end $$;
revoke execute on function public.heartbeat() from public, anon;
grant execute on function public.heartbeat() to authenticated;
create index profiles_last_seen_idx on public.profiles (last_seen_at);
