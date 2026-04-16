-- Base Operaria bootstrap SQL
-- Use this in the Supabase SQL Editor when you need to create the app schema manually
-- on a fresh database without relying on the local migration history.
--
-- Scope of this file:
-- - tables
-- - constraints
-- - helper functions used by constraints/triggers
-- - indexes
-- - updated_at / owner-membership triggers
-- - lookup seeds required by the UI
--
-- This file intentionally does not create storage buckets. For full production parity,
-- also apply the existing migrations under supabase/migrations.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudonym text not null,
  initial_link text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_pseudonym_length check (char_length(trim(pseudonym)) between 2 and 40),
  constraint profiles_initial_link_length check (char_length(trim(initial_link)) between 2 and 60)
);

create table if not exists public.severity_levels (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.frequency_levels (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.contract_types (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.salary_bands (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.issue_types (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.confirmation_types (
  code text primary key,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website text,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'moderator', 'member', 'observer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, profile_id)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, code)
);

create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  code text not null,
  description text,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, code)
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  code text not null,
  start_time time,
  end_time time,
  overnight boolean not null default false,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, code)
);

create table if not exists public.report_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_kind text not null check (category_kind in ('conditions', 'economic')),
  name text not null,
  code text not null,
  description text,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, category_kind, code)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  sector_id uuid references public.sectors(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  category_id uuid references public.report_categories(id) on delete set null,
  severity_code text references public.severity_levels(code) on delete restrict,
  frequency_code text references public.frequency_levels(code) on delete restrict,
  title text not null,
  description text,
  occurred_at timestamptz,
  source_profile_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'closed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  uploader_profile_id uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null default 'report-attachments',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_confirmations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  confirmation_type_code text not null references public.confirmation_types(code) on delete restrict,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (report_id, profile_id)
);

create table if not exists public.economic_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  sector_id uuid references public.sectors(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  category_id uuid references public.report_categories(id) on delete set null,
  severity_code text references public.severity_levels(code) on delete restrict,
  frequency_code text references public.frequency_levels(code) on delete restrict,
  contract_type_code text references public.contract_types(code) on delete restrict,
  salary_band_code text references public.salary_bands(code) on delete restrict,
  issue_type_code text references public.issue_types(code) on delete restrict,
  title text not null,
  description text,
  amount numeric(14,2),
  currency_code text not null default 'BRL',
  reported_at timestamptz,
  source_profile_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'closed', 'archived')),
  formal_role text,
  real_function text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.economic_report_confirmations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  economic_report_id uuid not null references public.economic_reports(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  confirmation_type_code text not null references public.confirmation_types(code) on delete restrict,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (economic_report_id, profile_id)
);

create table if not exists public.economic_report_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  economic_report_id uuid not null references public.economic_reports(id) on delete cascade,
  uploader_profile_id uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null default 'economic-report-attachments',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default timezone('utc', now()),
  unique (storage_bucket, storage_path)
);

create table if not exists public.issue_clusters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.report_categories(id) on delete set null,
  issue_type_code text references public.issue_types(code) on delete restrict,
  severity_code text references public.severity_levels(code) on delete restrict,
  title text not null,
  summary text,
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'archived')),
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cluster_reports (
  cluster_id uuid not null references public.issue_clusters(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (cluster_id, report_id)
);

create table if not exists public.cluster_economic_reports (
  cluster_id uuid not null references public.issue_clusters(id) on delete cascade,
  economic_report_id uuid not null references public.economic_reports(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (cluster_id, economic_report_id)
);

create table if not exists public.demands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cluster_id uuid references public.issue_clusters(id) on delete set null,
  title text not null,
  description text,
  priority_code text references public.severity_levels(code) on delete restrict,
  status text not null default 'open' check (status in ('draft', 'open', 'planned', 'in_progress', 'completed', 'cancelled')),
  kind text not null default 'conditions' check (kind in ('conditions', 'economic', 'mixed')),
  unit_id uuid references public.units(id) on delete set null,
  sector_id uuid references public.sectors(id) on delete set null,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.demand_supporters (
  demand_id uuid not null references public.demands(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (demand_id, profile_id)
);

create table if not exists public.nuclei (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  scope_kind text not null default 'sector' check (scope_kind in ('sector', 'theme')),
  sector_id uuid references public.sectors(id) on delete set null,
  theme text,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nucleus_members (
  nucleus_id uuid not null references public.nuclei(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'member', 'observer')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (nucleus_id, profile_id)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  nucleus_id uuid references public.nuclei(id) on delete set null,
  demand_id uuid references public.demands(id) on delete set null,
  cluster_id uuid references public.issue_clusters(id) on delete set null,
  title text not null,
  details text,
  action_type text not null default 'other' check (action_type in ('meeting', 'campaign', 'follow_up', 'negotiation', 'inspection', 'other')),
  status text not null default 'planned' check (status in ('planned', 'active', 'done', 'cancelled')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.report_category_matches_kind(
  target_category_id uuid,
  target_kind text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.report_categories rc
    where rc.id = target_category_id
      and rc.category_kind = target_kind
  );
$$;

create or replace function public.add_company_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.company_memberships (company_id, profile_id, role)
  values (new.id, new.created_by_profile_id, 'owner')
  on conflict (company_id, profile_id) do update
    set role = excluded.role,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

alter table public.reports
  drop constraint if exists reports_category_kind_check;

alter table public.reports
  add constraint reports_category_kind_check
  check (category_id is null or public.report_category_matches_kind(category_id, 'conditions'));

alter table public.economic_reports
  drop constraint if exists economic_reports_category_kind_check;

alter table public.economic_reports
  add constraint economic_reports_category_kind_check
  check (category_id is null or public.report_category_matches_kind(category_id, 'economic'));

create index if not exists reports_company_created_at_idx
  on public.reports (company_id, created_by_profile_id, created_at desc);

create index if not exists reports_company_category_idx
  on public.reports (company_id, category_id);

create index if not exists reports_company_status_idx
  on public.reports (company_id, status);

create index if not exists report_attachments_report_created_at_idx
  on public.report_attachments (report_id, created_at desc);

create index if not exists report_confirmations_report_created_at_idx
  on public.report_confirmations (report_id, created_at desc);

create index if not exists economic_reports_company_created_at_idx
  on public.economic_reports (company_id, created_by_profile_id, created_at desc);

create index if not exists economic_reports_company_issue_type_idx
  on public.economic_reports (company_id, issue_type_code);

create index if not exists economic_reports_company_salary_band_idx
  on public.economic_reports (company_id, salary_band_code);

create index if not exists economic_report_attachments_report_created_at_idx
  on public.economic_report_attachments (economic_report_id, created_at desc);

create index if not exists cluster_reports_company_idx
  on public.cluster_reports (company_id, created_at desc);

create index if not exists cluster_reports_cluster_idx
  on public.cluster_reports (cluster_id, created_at desc);

create index if not exists cluster_reports_report_idx
  on public.cluster_reports (report_id);

create index if not exists cluster_economic_reports_company_idx
  on public.cluster_economic_reports (company_id, created_at desc);

create index if not exists cluster_economic_reports_cluster_idx
  on public.cluster_economic_reports (cluster_id, created_at desc);

create index if not exists cluster_economic_reports_economic_report_idx
  on public.cluster_economic_reports (economic_report_id);

create index if not exists demands_company_created_at_idx
  on public.demands (company_id, created_at desc);

create index if not exists demands_company_kind_idx
  on public.demands (company_id, kind);

create index if not exists demands_company_status_idx
  on public.demands (company_id, status);

create index if not exists demands_cluster_idx
  on public.demands (cluster_id);

create index if not exists nuclei_company_created_at_idx
  on public.nuclei (company_id, created_at desc);

create index if not exists nuclei_company_scope_kind_idx
  on public.nuclei (company_id, scope_kind);

create index if not exists nucleus_members_nucleus_idx
  on public.nucleus_members (nucleus_id);

create index if not exists actions_nucleus_idx
  on public.actions (nucleus_id);

create index if not exists actions_nucleus_demand_idx
  on public.actions (nucleus_id, demand_id);

create index if not exists moderation_events_company_created_idx
  on public.moderation_events (company_id, created_at desc);

create index if not exists moderation_events_entity_created_idx
  on public.moderation_events (company_id, entity_type, entity_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists companies_add_owner_membership on public.companies;
create trigger companies_add_owner_membership
after insert on public.companies
for each row
execute function public.add_company_owner_membership();

drop trigger if exists companies_touch_updated_at on public.companies;
create trigger companies_touch_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists company_memberships_touch_updated_at on public.company_memberships;
create trigger company_memberships_touch_updated_at
before update on public.company_memberships
for each row
execute function public.set_updated_at();

drop trigger if exists units_touch_updated_at on public.units;
create trigger units_touch_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

drop trigger if exists sectors_touch_updated_at on public.sectors;
create trigger sectors_touch_updated_at
before update on public.sectors
for each row
execute function public.set_updated_at();

drop trigger if exists shifts_touch_updated_at on public.shifts;
create trigger shifts_touch_updated_at
before update on public.shifts
for each row
execute function public.set_updated_at();

drop trigger if exists report_categories_touch_updated_at on public.report_categories;
create trigger report_categories_touch_updated_at
before update on public.report_categories
for each row
execute function public.set_updated_at();

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

drop trigger if exists economic_reports_touch_updated_at on public.economic_reports;
create trigger economic_reports_touch_updated_at
before update on public.economic_reports
for each row
execute function public.set_updated_at();

drop trigger if exists issue_clusters_touch_updated_at on public.issue_clusters;
create trigger issue_clusters_touch_updated_at
before update on public.issue_clusters
for each row
execute function public.set_updated_at();

drop trigger if exists demands_touch_updated_at on public.demands;
create trigger demands_touch_updated_at
before update on public.demands
for each row
execute function public.set_updated_at();

drop trigger if exists nuclei_touch_updated_at on public.nuclei;
create trigger nuclei_touch_updated_at
before update on public.nuclei
for each row
execute function public.set_updated_at();

drop trigger if exists actions_touch_updated_at on public.actions;
create trigger actions_touch_updated_at
before update on public.actions
for each row
execute function public.set_updated_at();

insert into public.severity_levels (code, label, sort_order) values
  ('low', 'Baixa', 10),
  ('medium', 'Média', 20),
  ('high', 'Alta', 30),
  ('critical', 'Crítica', 40)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    active = true;

insert into public.frequency_levels (code, label, sort_order) values
  ('isolated', 'Isolada', 10),
  ('recurring', 'Recorrente', 20),
  ('frequent', 'Frequente', 30),
  ('constant', 'Constante', 40)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    active = true;

insert into public.contract_types (code, label, sort_order) values
  ('permanent', 'Efetivo', 10),
  ('temporary', 'Temporário', 20),
  ('outsourced', 'Terceirizado', 30),
  ('contractor', 'Prestador', 40),
  ('apprentice', 'Jovem aprendiz', 50),
  ('intern', 'Estágio', 60),
  ('other', 'Outro', 70)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    active = true;

insert into public.salary_bands (code, label, sort_order) values
  ('entry', 'Entrada', 10),
  ('lower', 'Faixa baixa', 20),
  ('mid', 'Faixa média', 30),
  ('upper', 'Faixa alta', 40),
  ('supervisory', 'Supervisão', 50),
  ('confidential', 'Confidencial', 60),
  ('other', 'Outra', 70)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    active = true;

insert into public.issue_types (code, label, sort_order) values
  ('safety', 'Segurança', 10),
  ('health', 'Saúde', 20),
  ('wages', 'Salários', 30),
  ('benefits', 'Benefícios', 40),
  ('workload', 'Carga de trabalho', 50),
  ('schedule', 'Jornada e turnos', 60),
  ('infrastructure', 'Infraestrutura', 70),
  ('harassment', 'Assédio', 80),
  ('equipment', 'Equipamentos', 90),
  ('other', 'Outro', 100),
  ('salario_baixo', 'Salário baixo', 110),
  ('equiparacao', 'Equiparação salarial', 120),
  ('desvio_de_funcao', 'Desvio de função', 130),
  ('hora_extra_nao_paga', 'Hora extra não paga', 140),
  ('adicional_nao_pago', 'Adicional não pago', 150),
  ('atraso_pagamento', 'Atraso de pagamento', 160),
  ('desconto_indevido', 'Desconto indevido', 170),
  ('beneficio_cortado', 'Benefício cortado', 180),
  ('beneficio_desigual', 'Benefício desigual', 190),
  ('plr_injusta', 'PLR injusta', 200),
  ('terceirizacao_desigual', 'Terceirização desigual', 210)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    active = true;

delete from public.confirmation_types;

insert into public.confirmation_types (code, label, sort_order, active) values
  ('acontece_tambem', 'Acontece também', 10, true),
  ('acontece_direto', 'Acontece direto', 20, true),
  ('tenho_prova', 'Tenho prova', 30, true),
  ('urgente', 'Urgente', 40, true);