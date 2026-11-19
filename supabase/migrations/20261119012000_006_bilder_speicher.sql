-- Bild-Schlüssel: auch Vereinsnamen (Stadionbilder) erlaubt, z. B. "stad.SV Wachtberg"
alter table public.media drop constraint if exists media_key_check;
alter table public.media add constraint media_key_check check (char_length(key) between 3 and 120 and key !~ '[/\\]');

-- Öffentlicher Speicher für Spielbilder (lesen: alle, schreiben: nur Admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

create policy media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_admin()));
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select private.is_admin())) with check (bucket_id = 'media' and (select private.is_admin()));
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

-- Admin: Feedback-Tickets mit Namen der Absender
create or replace function public.admin_tickets()
returns table (id bigint, ticket_no int, user_name text, message text, answer text, answered_at timestamptz, answer_read_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  return query select t.id, t.ticket_no, p.display_name, t.message, t.answer, t.answered_at, t.answer_read_at, t.created_at
    from public.feedback_tickets t left join public.profiles p on p.id = t.user_id
    order by (t.answer is null) desc, t.created_at desc limit 300;
end $$;
revoke execute on function public.admin_tickets() from public, anon;
grant execute on function public.admin_tickets() to authenticated;
