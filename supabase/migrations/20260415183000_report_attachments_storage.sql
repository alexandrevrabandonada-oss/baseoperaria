insert into storage.buckets (id, name, public)
values ('report-attachments', 'report-attachments', false)
on conflict (id) do update
set public = excluded.public;

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
