alter table public.economic_reports
  add column if not exists formal_role text,
  add column if not exists real_function text;

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

create index if not exists economic_reports_company_created_at_idx
  on public.economic_reports (company_id, created_by_profile_id, created_at desc);

create index if not exists economic_reports_company_issue_type_idx
  on public.economic_reports (company_id, issue_type_code);

create index if not exists economic_reports_company_salary_band_idx
  on public.economic_reports (company_id, salary_band_code);

create index if not exists economic_report_attachments_report_created_at_idx
  on public.economic_report_attachments (economic_report_id, created_at desc);

alter table public.economic_report_attachments enable row level security;

drop policy if exists "economic_report_attachments_select_members" on public.economic_report_attachments;
drop policy if exists "economic_report_attachments_insert_members" on public.economic_report_attachments;
drop policy if exists "economic_report_attachments_manage_uploader_or_admin" on public.economic_report_attachments;
drop policy if exists "economic_report_attachments_delete_uploader_or_admin" on public.economic_report_attachments;

create policy "economic_report_attachments_select_members"
on public.economic_report_attachments
for select
to authenticated
using (public.is_company_member(company_id));

create policy "economic_report_attachments_insert_members"
on public.economic_report_attachments
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(uploader_profile_id)
);

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

create policy "economic_report_attachments_delete_uploader_or_admin"
on public.economic_report_attachments
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);
