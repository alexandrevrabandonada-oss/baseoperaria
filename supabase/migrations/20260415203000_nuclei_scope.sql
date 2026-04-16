alter table public.nuclei
  add column if not exists scope_kind text not null default 'sector',
  add column if not exists sector_id uuid references public.sectors(id) on delete set null,
  add column if not exists theme text;

alter table public.nuclei
  drop constraint if exists nuclei_scope_kind_check;

alter table public.nuclei
  add constraint nuclei_scope_kind_check
  check (scope_kind in ('sector', 'theme'));

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
