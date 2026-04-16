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