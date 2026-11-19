-- Handy-Übergabe: Das Handy scannt einen Code, der PC muss den Login bestätigen.
create table if not exists public.handoffs (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  save_id uuid,
  status text not null default 'open' check (status in ('open','scanned','approved','denied','used')),
  hash text,
  created_at timestamptz not null default now()
);
create index if not exists handoffs_user_idx on public.handoffs(user_id);
alter table public.handoffs enable row level security;
-- keine Policies: nur der Server (Service-Rolle) liest und schreibt
revoke all on public.handoffs from anon, authenticated;
