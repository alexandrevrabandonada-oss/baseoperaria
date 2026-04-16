create table if not exists public.cluster_economic_reports (
  cluster_id uuid not null references public.issue_clusters(id) on delete cascade,
  economic_report_id uuid not null references public.economic_reports(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (cluster_id, economic_report_id)
);

create index if not exists cluster_economic_reports_company_idx
  on public.cluster_economic_reports (company_id, created_at desc);

create index if not exists cluster_economic_reports_cluster_idx
  on public.cluster_economic_reports (cluster_id, created_at desc);

create index if not exists cluster_economic_reports_economic_report_idx
  on public.cluster_economic_reports (economic_report_id);
