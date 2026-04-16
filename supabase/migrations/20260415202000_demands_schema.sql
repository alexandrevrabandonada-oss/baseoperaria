alter table public.demands
  add column if not exists kind text not null default 'conditions' check (kind in ('conditions', 'economic', 'mixed')),
  add column if not exists unit_id uuid references public.units(id) on delete set null,
  add column if not exists sector_id uuid references public.sectors(id) on delete set null;

create index if not exists demands_company_created_at_idx
  on public.demands (company_id, created_at desc);

create index if not exists demands_company_kind_idx
  on public.demands (company_id, kind);

create index if not exists demands_company_status_idx
  on public.demands (company_id, status);

create index if not exists demands_cluster_idx
  on public.demands (cluster_id);
