-- Zugangscodes: nur wer einmal einen Code eingelöst hat, darf (vorerst) spielen
alter table public.profiles add column if not exists access_at timestamptz;
update public.profiles set access_at = now() where is_admin and access_at is null;
create table if not exists public.access_keys (
  code text primary key check (code ~ '^[0-9]{8}$'),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz
);
alter table public.access_keys enable row level security;
create policy access_keys_admin on public.access_keys for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create or replace function public.admin_keys()
returns table (code text, note text, created_at timestamptz, used_at timestamptz, used_name text, used_email text, invited_by text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  return query select k.code, k.note, k.created_at, k.used_at, p.display_name, u.email::text, ip.display_name
    from public.access_keys k
    left join public.profiles p on p.id = k.used_by
    left join auth.users u on u.id = k.used_by
    left join public.invites i on i.invitee = k.used_by
    left join public.profiles ip on ip.id = i.inviter
    order by (k.used_at is null) desc, k.created_at desc limit 1000;
end $$;
revoke execute on function public.admin_keys() from public, anon;
grant execute on function public.admin_keys() to authenticated;
