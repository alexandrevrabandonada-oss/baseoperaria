-- Base Operaria all-in-one bootstrap
-- Generated from the ordered SQL bootstrap files.
-- Run this single file in the Supabase SQL Editor on a fresh project.


-- ===== BEGIN supabase/sql/base_operaria_bootstrap.sql =====

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

-- ===== END supabase/sql/base_operaria_bootstrap.sql =====


-- ===== BEGIN supabase/sql/base_operaria_authz.sql =====

-- Base Operaria authorization SQL
-- Apply this after base_operaria_bootstrap.sql when initializing a fresh Supabase project.
--
-- Scope:
-- - helper permission functions
-- - grants to authenticated
-- - RLS enablement
-- - policies for all current business tables

create or replace function public.is_current_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_profile_id;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.profile_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.profile_id = auth.uid()
      and cm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_company_moderator(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.profile_id = auth.uid()
      and cm.role in ('owner', 'admin', 'moderator')
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'severity_levels',
    'frequency_levels',
    'contract_types',
    'salary_bands',
    'issue_types',
    'confirmation_types',
    'companies',
    'company_memberships',
    'units',
    'sectors',
    'shifts',
    'report_categories',
    'reports',
    'report_attachments',
    'report_confirmations',
    'economic_reports',
    'economic_report_confirmations',
    'economic_report_attachments',
    'issue_clusters',
    'cluster_reports',
    'cluster_economic_reports',
    'demands',
    'demand_supporters',
    'nuclei',
    'nucleus_members',
    'actions',
    'moderation_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (public.is_current_profile(id));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (public.is_current_profile(id));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (public.is_current_profile(id))
with check (public.is_current_profile(id));

drop policy if exists "profiles_select_company_members" on public.profiles;
create policy "profiles_select_company_members"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.profile_id = profiles.id
      and public.is_company_member(cm.company_id)
  )
);

drop policy if exists "companies_select_members" on public.companies;
create policy "companies_select_members"
on public.companies
for select
to authenticated
using (public.is_company_member(id));

drop policy if exists "companies_insert_owner" on public.companies;
create policy "companies_insert_owner"
on public.companies
for insert
to authenticated
with check (public.is_current_profile(created_by_profile_id));

drop policy if exists "companies_manage_admins" on public.companies;
create policy "companies_manage_admins"
on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

drop policy if exists "companies_delete_admins" on public.companies;
create policy "companies_delete_admins"
on public.companies
for delete
to authenticated
using (public.is_company_admin(id));

drop policy if exists "company_memberships_select_company_members" on public.company_memberships;
create policy "company_memberships_select_company_members"
on public.company_memberships
for select
to authenticated
using (
  public.is_current_profile(profile_id)
  or public.is_company_member(company_id)
);

drop policy if exists "company_memberships_insert_admins" on public.company_memberships;
create policy "company_memberships_insert_admins"
on public.company_memberships
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and profile_id is not null
);

drop policy if exists "company_memberships_update_admins" on public.company_memberships;
create policy "company_memberships_update_admins"
on public.company_memberships
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "company_memberships_delete_self_or_admin" on public.company_memberships;
create policy "company_memberships_delete_self_or_admin"
on public.company_memberships
for delete
to authenticated
using (
  public.is_current_profile(profile_id)
  or public.is_company_admin(company_id)
);

drop policy if exists "lookup_select_authenticated" on public.severity_levels;
create policy "lookup_select_authenticated"
on public.severity_levels
for select
to authenticated
using (true);

drop policy if exists "lookup_select_authenticated" on public.frequency_levels;
create policy "lookup_select_authenticated"
on public.frequency_levels
for select
to authenticated
using (true);

drop policy if exists "lookup_select_authenticated" on public.contract_types;
create policy "lookup_select_authenticated"
on public.contract_types
for select
to authenticated
using (true);

drop policy if exists "lookup_select_authenticated" on public.salary_bands;
create policy "lookup_select_authenticated"
on public.salary_bands
for select
to authenticated
using (true);

drop policy if exists "lookup_select_authenticated" on public.issue_types;
create policy "lookup_select_authenticated"
on public.issue_types
for select
to authenticated
using (true);

drop policy if exists "lookup_select_authenticated" on public.confirmation_types;
create policy "lookup_select_authenticated"
on public.confirmation_types
for select
to authenticated
using (true);

drop policy if exists "units_select_members" on public.units;
create policy "units_select_members"
on public.units
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "units_insert_admins" on public.units;
create policy "units_insert_admins"
on public.units
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "units_manage_admins" on public.units;
create policy "units_manage_admins"
on public.units
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "units_delete_admins" on public.units;
create policy "units_delete_admins"
on public.units
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "sectors_select_members" on public.sectors;
create policy "sectors_select_members"
on public.sectors
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "sectors_insert_admins" on public.sectors;
create policy "sectors_insert_admins"
on public.sectors
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "sectors_manage_admins" on public.sectors;
create policy "sectors_manage_admins"
on public.sectors
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "sectors_delete_admins" on public.sectors;
create policy "sectors_delete_admins"
on public.sectors
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "shifts_select_members" on public.shifts;
create policy "shifts_select_members"
on public.shifts
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "shifts_insert_admins" on public.shifts;
create policy "shifts_insert_admins"
on public.shifts
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "shifts_manage_admins" on public.shifts;
create policy "shifts_manage_admins"
on public.shifts
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "shifts_delete_admins" on public.shifts;
create policy "shifts_delete_admins"
on public.shifts
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "report_categories_select_members" on public.report_categories;
create policy "report_categories_select_members"
on public.report_categories
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "report_categories_insert_admins" on public.report_categories;
create policy "report_categories_insert_admins"
on public.report_categories
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "report_categories_manage_admins" on public.report_categories;
create policy "report_categories_manage_admins"
on public.report_categories
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "report_categories_delete_admins" on public.report_categories;
create policy "report_categories_delete_admins"
on public.report_categories
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "reports_select_members" on public.reports;
create policy "reports_select_members"
on public.reports
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "reports_insert_members" on public.reports;
create policy "reports_insert_members"
on public.reports
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "reports_manage_creator_or_admin" on public.reports;
create policy "reports_manage_creator_or_admin"
on public.reports
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "reports_manage_moderators" on public.reports;
create policy "reports_manage_moderators"
on public.reports
for update
to authenticated
using (public.is_company_moderator(company_id))
with check (public.is_company_moderator(company_id));

drop policy if exists "reports_delete_creator_or_admin" on public.reports;
create policy "reports_delete_creator_or_admin"
on public.reports
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "report_attachments_select_members" on public.report_attachments;
create policy "report_attachments_select_members"
on public.report_attachments
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "report_attachments_insert_members" on public.report_attachments;
create policy "report_attachments_insert_members"
on public.report_attachments
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(uploader_profile_id)
);

drop policy if exists "report_attachments_manage_uploader_or_admin" on public.report_attachments;
create policy "report_attachments_manage_uploader_or_admin"
on public.report_attachments
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);

drop policy if exists "report_attachments_delete_uploader_or_admin" on public.report_attachments;
create policy "report_attachments_delete_uploader_or_admin"
on public.report_attachments
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);

drop policy if exists "report_confirmations_select_members" on public.report_confirmations;
create policy "report_confirmations_select_members"
on public.report_confirmations
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "report_confirmations_insert_self" on public.report_confirmations;
create policy "report_confirmations_insert_self"
on public.report_confirmations
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

drop policy if exists "report_confirmations_manage_self_or_admin" on public.report_confirmations;
create policy "report_confirmations_manage_self_or_admin"
on public.report_confirmations
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "report_confirmations_delete_self_or_admin" on public.report_confirmations;
create policy "report_confirmations_delete_self_or_admin"
on public.report_confirmations
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "economic_reports_select_members" on public.economic_reports;
create policy "economic_reports_select_members"
on public.economic_reports
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "economic_reports_insert_members" on public.economic_reports;
create policy "economic_reports_insert_members"
on public.economic_reports
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "economic_reports_manage_creator_or_admin" on public.economic_reports;
create policy "economic_reports_manage_creator_or_admin"
on public.economic_reports
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "economic_reports_manage_moderators" on public.economic_reports;
create policy "economic_reports_manage_moderators"
on public.economic_reports
for update
to authenticated
using (public.is_company_moderator(company_id))
with check (public.is_company_moderator(company_id));

drop policy if exists "economic_reports_delete_creator_or_admin" on public.economic_reports;
create policy "economic_reports_delete_creator_or_admin"
on public.economic_reports
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "economic_report_confirmations_select_members" on public.economic_report_confirmations;
create policy "economic_report_confirmations_select_members"
on public.economic_report_confirmations
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "economic_report_confirmations_insert_self" on public.economic_report_confirmations;
create policy "economic_report_confirmations_insert_self"
on public.economic_report_confirmations
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

drop policy if exists "economic_report_confirmations_manage_self_or_admin" on public.economic_report_confirmations;
create policy "economic_report_confirmations_manage_self_or_admin"
on public.economic_report_confirmations
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "economic_report_confirmations_delete_self_or_admin" on public.economic_report_confirmations;
create policy "economic_report_confirmations_delete_self_or_admin"
on public.economic_report_confirmations
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "economic_report_attachments_select_members" on public.economic_report_attachments;
create policy "economic_report_attachments_select_members"
on public.economic_report_attachments
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "economic_report_attachments_insert_members" on public.economic_report_attachments;
create policy "economic_report_attachments_insert_members"
on public.economic_report_attachments
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(uploader_profile_id)
);

drop policy if exists "economic_report_attachments_manage_uploader_or_admin" on public.economic_report_attachments;
create policy "economic_report_attachments_manage_uploader_or_admin"
on public.economic_report_attachments
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);

drop policy if exists "economic_report_attachments_delete_uploader_or_admin" on public.economic_report_attachments;
create policy "economic_report_attachments_delete_uploader_or_admin"
on public.economic_report_attachments
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);

drop policy if exists "issue_clusters_select_members" on public.issue_clusters;
create policy "issue_clusters_select_members"
on public.issue_clusters
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "issue_clusters_insert_admins" on public.issue_clusters;
create policy "issue_clusters_insert_admins"
on public.issue_clusters
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "issue_clusters_manage_admins" on public.issue_clusters;
create policy "issue_clusters_manage_admins"
on public.issue_clusters
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "issue_clusters_delete_admins" on public.issue_clusters;
create policy "issue_clusters_delete_admins"
on public.issue_clusters
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "cluster_reports_select_members" on public.cluster_reports;
create policy "cluster_reports_select_members"
on public.cluster_reports
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "cluster_reports_insert_admins" on public.cluster_reports;
create policy "cluster_reports_insert_admins"
on public.cluster_reports
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "cluster_reports_insert_moderators" on public.cluster_reports;
create policy "cluster_reports_insert_moderators"
on public.cluster_reports
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "cluster_reports_manage_admins" on public.cluster_reports;
create policy "cluster_reports_manage_admins"
on public.cluster_reports
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "cluster_reports_delete_admins" on public.cluster_reports;
create policy "cluster_reports_delete_admins"
on public.cluster_reports
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "cluster_reports_delete_moderators" on public.cluster_reports;
create policy "cluster_reports_delete_moderators"
on public.cluster_reports
for delete
to authenticated
using (public.is_company_moderator(company_id));

drop policy if exists "cluster_economic_reports_select_members" on public.cluster_economic_reports;
create policy "cluster_economic_reports_select_members"
on public.cluster_economic_reports
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "cluster_economic_reports_insert_admins" on public.cluster_economic_reports;
create policy "cluster_economic_reports_insert_admins"
on public.cluster_economic_reports
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "cluster_economic_reports_insert_moderators" on public.cluster_economic_reports;
create policy "cluster_economic_reports_insert_moderators"
on public.cluster_economic_reports
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "cluster_economic_reports_manage_admins" on public.cluster_economic_reports;
create policy "cluster_economic_reports_manage_admins"
on public.cluster_economic_reports
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "cluster_economic_reports_delete_admins" on public.cluster_economic_reports;
create policy "cluster_economic_reports_delete_admins"
on public.cluster_economic_reports
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "cluster_economic_reports_delete_moderators" on public.cluster_economic_reports;
create policy "cluster_economic_reports_delete_moderators"
on public.cluster_economic_reports
for delete
to authenticated
using (public.is_company_moderator(company_id));

drop policy if exists "demands_select_members" on public.demands;
create policy "demands_select_members"
on public.demands
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "demands_insert_members" on public.demands;
create policy "demands_insert_members"
on public.demands
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "demands_manage_creator_or_admin" on public.demands;
create policy "demands_manage_creator_or_admin"
on public.demands
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "demands_delete_creator_or_admin" on public.demands;
create policy "demands_delete_creator_or_admin"
on public.demands
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "demand_supporters_select_members" on public.demand_supporters;
create policy "demand_supporters_select_members"
on public.demand_supporters
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "demand_supporters_insert_self" on public.demand_supporters;
create policy "demand_supporters_insert_self"
on public.demand_supporters
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

drop policy if exists "demand_supporters_delete_self_or_admin" on public.demand_supporters;
create policy "demand_supporters_delete_self_or_admin"
on public.demand_supporters
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "nuclei_select_members" on public.nuclei;
create policy "nuclei_select_members"
on public.nuclei
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "nuclei_insert_members" on public.nuclei;
drop policy if exists "nuclei_insert_admins" on public.nuclei;
create policy "nuclei_insert_admins"
on public.nuclei
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "nuclei_manage_creator_or_admin" on public.nuclei;
create policy "nuclei_manage_creator_or_admin"
on public.nuclei
for update
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
)
with check (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "nuclei_delete_creator_or_admin" on public.nuclei;
create policy "nuclei_delete_creator_or_admin"
on public.nuclei
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

drop policy if exists "nucleus_members_select_members" on public.nucleus_members;
create policy "nucleus_members_select_members"
on public.nucleus_members
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "nucleus_members_insert_self_or_admin" on public.nucleus_members;
create policy "nucleus_members_insert_self_or_admin"
on public.nucleus_members
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and (
    public.is_company_admin(company_id)
    or public.is_current_profile(profile_id)
  )
);

drop policy if exists "nucleus_members_delete_self_or_admin" on public.nucleus_members;
create policy "nucleus_members_delete_self_or_admin"
on public.nucleus_members
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

drop policy if exists "actions_select_members" on public.actions;
create policy "actions_select_members"
on public.actions
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "actions_insert_admins" on public.actions;
create policy "actions_insert_admins"
on public.actions
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

drop policy if exists "actions_manage_admins" on public.actions;
create policy "actions_manage_admins"
on public.actions
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "actions_delete_admins" on public.actions;
create policy "actions_delete_admins"
on public.actions
for delete
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "moderation_events_select_admins" on public.moderation_events;
create policy "moderation_events_select_admins"
on public.moderation_events
for select
to authenticated
using (public.is_company_admin(company_id));

drop policy if exists "moderation_events_select_moderators" on public.moderation_events;
create policy "moderation_events_select_moderators"
on public.moderation_events
for select
to authenticated
using (public.is_company_moderator(company_id));

drop policy if exists "moderation_events_insert_admins" on public.moderation_events;
create policy "moderation_events_insert_admins"
on public.moderation_events
for insert
to authenticated
with check (public.is_company_admin(company_id));

drop policy if exists "moderation_events_insert_moderators" on public.moderation_events;
create policy "moderation_events_insert_moderators"
on public.moderation_events
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(actor_profile_id)
);

drop policy if exists "moderation_events_manage_admins" on public.moderation_events;
create policy "moderation_events_manage_admins"
on public.moderation_events
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "moderation_events_delete_admins" on public.moderation_events;
create policy "moderation_events_delete_admins"
on public.moderation_events
for delete
to authenticated
using (public.is_company_admin(company_id));

-- ===== END supabase/sql/base_operaria_authz.sql =====


-- ===== BEGIN supabase/sql/base_operaria_storage.sql =====

-- Base Operaria storage bootstrap
-- Run this after:
-- 1. base_operaria_bootstrap.sql
-- 2. base_operaria_authz.sql
--
-- Purpose:
-- - create the private buckets used by the app
-- - apply storage.objects policies based on company membership
-- - allow uploads only when the first path segment is the company UUID

insert into storage.buckets (id, name, public)
values ('report-attachments', 'report-attachments', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

insert into storage.buckets (id, name, public)
values ('economic-report-attachments', 'economic-report-attachments', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "report_attachments_insert" on storage.objects;
drop policy if exists "report_attachments_select" on storage.objects;
drop policy if exists "report_attachments_update" on storage.objects;
drop policy if exists "report_attachments_delete" on storage.objects;

create policy "report_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "report_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "report_attachments_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "report_attachments_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "economic_report_attachments_insert" on storage.objects;
drop policy if exists "economic_report_attachments_select" on storage.objects;
drop policy if exists "economic_report_attachments_update" on storage.objects;
drop policy if exists "economic_report_attachments_delete" on storage.objects;

create policy "economic_report_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'economic-report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "economic_report_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'economic-report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "economic_report_attachments_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'economic-report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
)
with check (
  bucket_id = 'economic-report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

create policy "economic_report_attachments_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'economic-report-attachments'
  and public.is_company_member((split_part(name, '/', 1))::uuid)
);

-- ===== END supabase/sql/base_operaria_storage.sql =====


-- ===== BEGIN supabase/sql/base_operaria_first_access_template.sql =====

-- Base Operaria first access bootstrap
-- Edit the constants below and run after:
-- 1. base_operaria_bootstrap.sql
-- 2. base_operaria_authz.sql
--
-- Goal:
-- - create/update the user's profile row in public.profiles
-- - create the first company
-- - let the trigger create owner membership automatically

do $$
declare
  target_user_id uuid := '2729fb9d-7cc1-4d34-a5d1-542a5d308dc3';
  target_pseudonym text := 'Alexandre';
  target_initial_link text := 'base';
  target_company_name text := 'Empresa Piloto';
  target_company_slug text := 'empresa-piloto';
  target_company_description text := 'Empresa inicial da Base Operaria';
begin
  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'O usuario % nao existe em auth.users', target_user_id;
  end if;

  insert into public.profiles (id, pseudonym, initial_link)
  values (target_user_id, target_pseudonym, target_initial_link)
  on conflict (id) do update
    set pseudonym = excluded.pseudonym,
        initial_link = excluded.initial_link,
        updated_at = timezone('utc', now());

  insert into public.companies (
    name,
    slug,
    description,
    created_by_profile_id
  )
  values (
    target_company_name,
    target_company_slug,
    target_company_description,
    target_user_id
  )
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        updated_at = timezone('utc', now());
end;
$$;

-- Optional promotion examples:
-- update public.company_memberships
-- set role = 'admin', updated_at = timezone('utc', now())
-- where company_id = '<company-id>' and profile_id = '<profile-id>';
--
-- update public.company_memberships
-- set role = 'moderator', updated_at = timezone('utc', now())
-- where company_id = '<company-id>' and profile_id = '<profile-id>';

-- ===== END supabase/sql/base_operaria_first_access_template.sql =====


-- ===== BEGIN supabase/sql/base_operaria_pilot_setup_template.sql =====

-- Base Operaria pilot setup
-- Run this after:
-- 1. base_operaria_bootstrap.sql
-- 2. base_operaria_authz.sql
-- 3. base_operaria_first_access_template.sql
--
-- Goal:
-- - create a minimal operational structure for one pilot company
-- - add at least one unit, one sector, one shift and starter categories

do $$
declare
  target_company_slug text := 'empresa-piloto';
  target_creator_profile_id uuid := '2729fb9d-7cc1-4d34-a5d1-542a5d308dc3';
  target_company_id uuid;
  target_unit_id uuid;
begin
  select id
  into target_company_id
  from public.companies
  where slug = target_company_slug;

  if target_company_id is null then
    raise exception 'Empresa com slug % nao encontrada. Rode primeiro o script de first access.', target_company_slug;
  end if;

  insert into public.units (
    company_id,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values (
    target_company_id,
    'Unidade Principal',
    'unidade-principal',
    'Unidade inicial do piloto',
    target_creator_profile_id,
    true
  )
  on conflict (company_id, code) do update
    set name = excluded.name,
        description = excluded.description,
        active = true,
        updated_at = timezone('utc', now())
  returning id into target_unit_id;

  if target_unit_id is null then
    select id
    into target_unit_id
    from public.units
    where company_id = target_company_id
      and code = 'unidade-principal';
  end if;

  insert into public.sectors (
    company_id,
    unit_id,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      target_unit_id,
      'Producao',
      'producao',
      'Setor inicial de producao',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      target_unit_id,
      'Expedicao',
      'expedicao',
      'Setor inicial de expedicao',
      target_creator_profile_id,
      true
    )
  on conflict (company_id, code) do update
    set name = excluded.name,
        description = excluded.description,
        unit_id = excluded.unit_id,
        active = true,
        updated_at = timezone('utc', now());

  insert into public.shifts (
    company_id,
    unit_id,
    name,
    code,
    start_time,
    end_time,
    overnight,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      target_unit_id,
      'Dia',
      'dia',
      '08:00',
      '17:00',
      false,
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      target_unit_id,
      'Noite',
      'noite',
      '22:00',
      '06:00',
      true,
      target_creator_profile_id,
      true
    )
  on conflict (company_id, code) do update
    set name = excluded.name,
        unit_id = excluded.unit_id,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        overnight = excluded.overnight,
        active = true,
        updated_at = timezone('utc', now());

  insert into public.report_categories (
    company_id,
    category_kind,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      'conditions',
      'Ritmo e carga',
      'ritmo-carga',
      'Problemas de ritmo, aculo e pressao cotidiana',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'conditions',
      'Seguranca e risco',
      'seguranca-risco',
      'Problemas de seguranca, risco e exposicao',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'conditions',
      'Chefia e assedio',
      'chefia-assedio',
      'Problemas de assedio, pressao e abuso de chefia',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Salario e desconto',
      'salario-desconto',
      'Salario baixo, atraso, desconto e nao pagamento',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Desvio de funcao',
      'desvio-funcao',
      'Funcao real diferente do cargo formal',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Beneficio e vinculo',
      'beneficio-vinculo',
      'Problemas com beneficio, contrato e vinculo de trabalho',
      target_creator_profile_id,
      true
    )
  on conflict (company_id, category_kind, code) do update
    set name = excluded.name,
        description = excluded.description,
        active = true,
        updated_at = timezone('utc', now());
end;
$$;

-- ===== END supabase/sql/base_operaria_pilot_setup_template.sql =====

