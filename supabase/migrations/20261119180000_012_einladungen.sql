-- Einladungen (Affiliate): persönliche Codes je Spieler, Seller-Codes fürs Vermarktungsteam, Zuordnung neuer Spieler
create table if not exists public.invite_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{4,24}$'),
  user_id uuid references auth.users (id) on delete set null,
  label text,
  seller boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists invite_codes_user on public.invite_codes (user_id) where not seller;
create table if not exists public.invites (
  invitee uuid primary key references auth.users (id) on delete cascade,
  code text not null references public.invite_codes (code) on update cascade,
  inviter uuid references auth.users (id) on delete set null,
  confirmed boolean not null default false,
  seasons int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists invites_code on public.invites (code);
create index if not exists invites_inviter on public.invites (inviter);
-- Bonus-Guthaben (Joker/Sterne aus Einladungs-Missionen) und erledigte Konto-Missionen
alter table public.profiles add column if not exists bonus jsonb not null default '{}'::jsonb;
alter table public.invite_codes enable row level security;
alter table public.invites enable row level security;
create policy invite_codes_admin on public.invite_codes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy invites_admin_lesen on public.invites for select to authenticated using ((select private.is_admin()));
