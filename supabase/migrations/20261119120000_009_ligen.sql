-- Echte Ligen und Mannschaften (Quelle: fussball.de), öffentlich lesbar, schreiben nur Server/Import
create table if not exists public.ligen_staffeln (
  id text primary key,
  saison text not null,
  verband text not null,
  ebene int not null,
  klasse text not null,
  name text not null,
  name_fd text not null,
  gebiet text,
  aktiv boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists ligen_staffeln_verband_ebene on public.ligen_staffeln (verband, ebene);

create table if not exists public.ligen_teams (
  id text primary key,
  staffel_id text not null references public.ligen_staffeln (id) on delete cascade,
  verein_id text,
  name text not null,
  name_fd text not null,
  rang int,
  zone text,
  aktiv boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists ligen_teams_staffel on public.ligen_teams (staffel_id);
create index if not exists ligen_teams_verein on public.ligen_teams (verein_id);

alter table public.ligen_staffeln enable row level security;
alter table public.ligen_teams enable row level security;
create policy ligen_staffeln_lesen on public.ligen_staffeln for select to anon, authenticated using (true);
create policy ligen_teams_lesen on public.ligen_teams for select to anon, authenticated using (true);
