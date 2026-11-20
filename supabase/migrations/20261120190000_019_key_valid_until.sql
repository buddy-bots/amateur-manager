-- Zugangscodes mit Ablaufdatum: Standard 31.12.2999, im Admin änderbar.
-- Das Datum wird beim Einlösen ins Profil übernommen und bei Änderung am Key nachgezogen.
alter table public.access_keys add column if not exists valid_until date not null default date '2999-12-31';
alter table public.profiles add column if not exists access_until date;

update public.profiles p set access_until = k.valid_until
  from public.access_keys k where k.used_by = p.id and p.access_at is not null and p.access_until is null;

create or replace function private.key_sync_until() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.used_by is not null and new.valid_until is distinct from old.valid_until then
    update public.profiles set access_until = new.valid_until where id = new.used_by;
  end if;
  return new;
end $$;
drop trigger if exists access_keys_sync_until on public.access_keys;
create trigger access_keys_sync_until after update of valid_until on public.access_keys for each row execute function private.key_sync_until();

drop function if exists public.admin_keys();
create function public.admin_keys()
 returns table(code text, note text, created_at timestamptz, used_at timestamptz, used_name text, used_email text, invited_by text, valid_until date)
 language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  return query select k.code, k.note, k.created_at, k.used_at, p.display_name, u.email::text, ip.display_name, k.valid_until
    from public.access_keys k
    left join public.profiles p on p.id = k.used_by
    left join auth.users u on u.id = k.used_by
    left join public.invites i on i.invitee = k.used_by
    left join public.profiles ip on ip.id = i.inviter
    order by (k.used_at is null) desc, k.created_at desc limit 1000;
end $$;
revoke all on function public.admin_keys() from public, anon;
grant execute on function public.admin_keys() to authenticated;
