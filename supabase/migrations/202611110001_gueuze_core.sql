-- LA GUEUZE V2 — migration additive et non destructive.
-- Crée uniquement des tables gueuze_* dédiées. Ne modifie aucune table HIPPO CORE existante.
-- À relire et exécuter manuellement dans le SQL Editor du projet central après sauvegarde.

create table if not exists public.gueuze_productions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  production_type text,
  status text not null default 'En préparation',
  start_date date,
  end_date date,
  location text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gueuze_memberships (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.gueuze_productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','production','department','viewer')),
  created_at timestamptz not null default now(),
  unique(production_id,user_id)
);

create table if not exists public.gueuze_callsheets (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.gueuze_productions(id) on delete cascade,
  title text not null,
  shoot_date date,
  call_time time,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  storage_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.gueuze_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.gueuze_productions(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.gueuze_productions enable row level security;
alter table public.gueuze_memberships enable row level security;
alter table public.gueuze_callsheets enable row level security;
alter table public.gueuze_qr_tokens enable row level security;

drop policy if exists "gueuze production members read" on public.gueuze_productions;
create policy "gueuze production members read" on public.gueuze_productions
for select to authenticated using (
  created_by = auth.uid() or exists (
    select 1 from public.gueuze_memberships m
    where m.production_id = id and m.user_id = auth.uid()
  )
);
drop policy if exists "gueuze owners create" on public.gueuze_productions;
create policy "gueuze owners create" on public.gueuze_productions
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "gueuze membership self read" on public.gueuze_memberships;
create policy "gueuze membership self read" on public.gueuze_memberships
for select to authenticated using (user_id = auth.uid());

drop policy if exists "gueuze callsheets member read" on public.gueuze_callsheets;
create policy "gueuze callsheets member read" on public.gueuze_callsheets
for select to authenticated using (
  exists (select 1 from public.gueuze_memberships m
    where m.production_id = gueuze_callsheets.production_id and m.user_id = auth.uid())
  or exists (select 1 from public.gueuze_productions p
    where p.id = gueuze_callsheets.production_id and p.created_by = auth.uid())
);

-- Les jetons QR ne sont jamais lisibles par les utilisateurs ordinaires.
-- Leur émission, hachage, validation et révocation doivent passer par une Edge Function
-- utilisant un secret côté serveur, jamais par le navigateur.
revoke all on public.gueuze_qr_tokens from anon, authenticated;
