alter table public.cluster_economic_reports enable row level security;

grant select, insert, delete on public.cluster_economic_reports to authenticated;

create policy "cluster_economic_reports_select_members"
on public.cluster_economic_reports
for select
to authenticated
using (public.is_company_member(company_id));

create policy "cluster_economic_reports_insert_admins"
on public.cluster_economic_reports
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "cluster_economic_reports_manage_admins"
on public.cluster_economic_reports
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "cluster_economic_reports_delete_admins"
on public.cluster_economic_reports
for delete
to authenticated
using (public.is_company_admin(company_id));
