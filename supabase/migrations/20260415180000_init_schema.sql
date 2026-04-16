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
    set role = excluded.role;

  return new;
end;
$$;

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
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'observer')),
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
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reports_category_kind_check
    check (category_id is null or public.report_category_matches_kind(category_id, 'conditions'))
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint economic_reports_category_kind_check
    check (category_id is null or public.report_category_matches_kind(category_id, 'economic'))
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

create table if not exists public.demands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cluster_id uuid references public.issue_clusters(id) on delete set null,
  title text not null,
  description text,
  priority_code text references public.severity_levels(code) on delete restrict,
  status text not null default 'open' check (status in ('draft', 'open', 'planned', 'in_progress', 'completed', 'cancelled')),
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

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'companies_add_owner_membership') then
    create trigger companies_add_owner_membership
    after insert on public.companies
    for each row
    execute function public.add_company_owner_membership();
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'companies_touch_updated_at') then
    create trigger companies_touch_updated_at
    before update on public.companies
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

create trigger company_memberships_touch_updated_at
before update on public.company_memberships
for each row
execute function public.set_updated_at();

create trigger units_touch_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

create trigger sectors_touch_updated_at
before update on public.sectors
for each row
execute function public.set_updated_at();

create trigger shifts_touch_updated_at
before update on public.shifts
for each row
execute function public.set_updated_at();

create trigger report_categories_touch_updated_at
before update on public.report_categories
for each row
execute function public.set_updated_at();

create trigger reports_touch_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

create trigger economic_reports_touch_updated_at
before update on public.economic_reports
for each row
execute function public.set_updated_at();

create trigger issue_clusters_touch_updated_at
before update on public.issue_clusters
for each row
execute function public.set_updated_at();

create trigger demands_touch_updated_at
before update on public.demands
for each row
execute function public.set_updated_at();

create trigger nuclei_touch_updated_at
before update on public.nuclei
for each row
execute function public.set_updated_at();

create trigger actions_touch_updated_at
before update on public.actions
for each row
execute function public.set_updated_at();

insert into public.severity_levels (code, label, sort_order) values
  ('low', 'Baixa', 10),
  ('medium', 'Média', 20),
  ('high', 'Alta', 30),
  ('critical', 'Crítica', 40)
on conflict (code) do nothing;

insert into public.frequency_levels (code, label, sort_order) values
  ('isolated', 'Isolada', 10),
  ('recurring', 'Recorrente', 20),
  ('frequent', 'Frequente', 30),
  ('constant', 'Constante', 40)
on conflict (code) do nothing;

insert into public.contract_types (code, label, sort_order) values
  ('permanent', 'Efetivo', 10),
  ('temporary', 'Temporário', 20),
  ('outsourced', 'Terceirizado', 30),
  ('contractor', 'Prestador', 40),
  ('apprentice', 'Jovem aprendiz', 50),
  ('intern', 'Estágio', 60),
  ('other', 'Outro', 70)
on conflict (code) do nothing;

insert into public.salary_bands (code, label, sort_order) values
  ('entry', 'Entrada', 10),
  ('lower', 'Faixa baixa', 20),
  ('mid', 'Faixa média', 30),
  ('upper', 'Faixa alta', 40),
  ('supervisory', 'Supervisão', 50),
  ('confidential', 'Confidencial', 60),
  ('other', 'Outra', 70)
on conflict (code) do nothing;

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
  ('other', 'Outro', 100)
on conflict (code) do nothing;

insert into public.confirmation_types (code, label, sort_order) values
  ('direct', 'Vivenciado', 10),
  ('witnessed', 'Testemunhado', 20),
  ('documented', 'Documentado', 30),
  ('pattern', 'Padrão recorrente', 40),
  ('other', 'Outro', 50)
on conflict (code) do nothing;
