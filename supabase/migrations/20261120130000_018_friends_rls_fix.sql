-- Freundschaftsanfragen: Policy darf die eigene Tabelle nicht direkt abfragen (Endlosschleife)
create or replace function private.friend_row_exists(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friends f where f.user_id = a and f.friend_id = b);
$$;
drop policy if exists fr_insert on public.friends;
create policy fr_insert on public.friends for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and not private.friend_row_exists(friend_id, user_id));
