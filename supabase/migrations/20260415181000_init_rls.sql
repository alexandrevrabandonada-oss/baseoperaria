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

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    'issue_clusters',
    'cluster_reports',
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

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (public.is_current_profile(id));

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (public.is_current_profile(id));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (public.is_current_profile(id))
with check (public.is_current_profile(id));

create policy "companies_select_members"
on public.companies
for select
to authenticated
using (public.is_company_member(id));

create policy "companies_insert_owner"
on public.companies
for insert
to authenticated
with check (public.is_current_profile(created_by_profile_id));

create policy "companies_manage_admins"
on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

create policy "companies_delete_admins"
on public.companies
for delete
to authenticated
using (public.is_company_admin(id));

create policy "company_memberships_select_company_members"
on public.company_memberships
for select
to authenticated
using (
  public.is_current_profile(profile_id)
  or public.is_company_member(company_id)
);

create policy "company_memberships_insert_admins"
on public.company_memberships
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and profile_id is not null
);

create policy "company_memberships_update_admins"
on public.company_memberships
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "company_memberships_delete_self_or_admin"
on public.company_memberships
for delete
to authenticated
using (
  public.is_current_profile(profile_id)
  or public.is_company_admin(company_id)
);

create policy "lookup_select_authenticated"
on public.severity_levels
for select
to authenticated
using (true);

create policy "lookup_select_authenticated"
on public.frequency_levels
for select
to authenticated
using (true);

create policy "lookup_select_authenticated"
on public.contract_types
for select
to authenticated
using (true);

create policy "lookup_select_authenticated"
on public.salary_bands
for select
to authenticated
using (true);

create policy "lookup_select_authenticated"
on public.issue_types
for select
to authenticated
using (true);

create policy "lookup_select_authenticated"
on public.confirmation_types
for select
to authenticated
using (true);

create policy "units_select_members"
on public.units
for select
to authenticated
using (public.is_company_member(company_id));

create policy "units_insert_admins"
on public.units
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "units_manage_admins"
on public.units
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "units_delete_admins"
on public.units
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "sectors_select_members"
on public.sectors
for select
to authenticated
using (public.is_company_member(company_id));

create policy "sectors_insert_admins"
on public.sectors
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "sectors_manage_admins"
on public.sectors
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "sectors_delete_admins"
on public.sectors
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "shifts_select_members"
on public.shifts
for select
to authenticated
using (public.is_company_member(company_id));

create policy "shifts_insert_admins"
on public.shifts
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "shifts_manage_admins"
on public.shifts
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "shifts_delete_admins"
on public.shifts
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "report_categories_select_members"
on public.report_categories
for select
to authenticated
using (public.is_company_member(company_id));

create policy "report_categories_insert_admins"
on public.report_categories
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "report_categories_manage_admins"
on public.report_categories
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "report_categories_delete_admins"
on public.report_categories
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "reports_select_members"
on public.reports
for select
to authenticated
using (public.is_company_member(company_id));

create policy "reports_insert_members"
on public.reports
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

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

create policy "reports_delete_creator_or_admin"
on public.reports
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

create policy "report_attachments_select_members"
on public.report_attachments
for select
to authenticated
using (public.is_company_member(company_id));

create policy "report_attachments_insert_members"
on public.report_attachments
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(uploader_profile_id)
);

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

create policy "report_attachments_delete_uploader_or_admin"
on public.report_attachments
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(uploader_profile_id)
);

create policy "report_confirmations_select_members"
on public.report_confirmations
for select
to authenticated
using (public.is_company_member(company_id));

create policy "report_confirmations_insert_self"
on public.report_confirmations
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

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

create policy "report_confirmations_delete_self_or_admin"
on public.report_confirmations
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

create policy "economic_reports_select_members"
on public.economic_reports
for select
to authenticated
using (public.is_company_member(company_id));

create policy "economic_reports_insert_members"
on public.economic_reports
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

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

create policy "economic_reports_delete_creator_or_admin"
on public.economic_reports
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

create policy "economic_report_confirmations_select_members"
on public.economic_report_confirmations
for select
to authenticated
using (public.is_company_member(company_id));

create policy "economic_report_confirmations_insert_self"
on public.economic_report_confirmations
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

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

create policy "economic_report_confirmations_delete_self_or_admin"
on public.economic_report_confirmations
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

create policy "issue_clusters_select_members"
on public.issue_clusters
for select
to authenticated
using (public.is_company_member(company_id));

create policy "issue_clusters_insert_admins"
on public.issue_clusters
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "issue_clusters_manage_admins"
on public.issue_clusters
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "issue_clusters_delete_admins"
on public.issue_clusters
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "cluster_reports_select_members"
on public.cluster_reports
for select
to authenticated
using (public.is_company_member(company_id));

create policy "cluster_reports_insert_admins"
on public.cluster_reports
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "cluster_reports_manage_admins"
on public.cluster_reports
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "cluster_reports_delete_admins"
on public.cluster_reports
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "demands_select_members"
on public.demands
for select
to authenticated
using (public.is_company_member(company_id));

create policy "demands_insert_members"
on public.demands
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

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

create policy "demands_delete_creator_or_admin"
on public.demands
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

create policy "demand_supporters_select_members"
on public.demand_supporters
for select
to authenticated
using (public.is_company_member(company_id));

create policy "demand_supporters_insert_self"
on public.demand_supporters
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(profile_id)
);

create policy "demand_supporters_delete_self_or_admin"
on public.demand_supporters
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

create policy "nuclei_select_members"
on public.nuclei
for select
to authenticated
using (public.is_company_member(company_id));

create policy "nuclei_insert_members"
on public.nuclei
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  and public.is_current_profile(created_by_profile_id)
);

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

create policy "nuclei_delete_creator_or_admin"
on public.nuclei
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(created_by_profile_id)
);

create policy "nucleus_members_select_members"
on public.nucleus_members
for select
to authenticated
using (public.is_company_member(company_id));

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

create policy "nucleus_members_delete_self_or_admin"
on public.nucleus_members
for delete
to authenticated
using (
  public.is_company_admin(company_id)
  or public.is_current_profile(profile_id)
);

create policy "actions_select_members"
on public.actions
for select
to authenticated
using (public.is_company_member(company_id));

create policy "actions_insert_admins"
on public.actions
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "actions_manage_admins"
on public.actions
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "actions_delete_admins"
on public.actions
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "moderation_events_select_admins"
on public.moderation_events
for select
to authenticated
using (public.is_company_admin(company_id));

create policy "moderation_events_insert_admins"
on public.moderation_events
for insert
to authenticated
with check (public.is_company_admin(company_id));

create policy "moderation_events_manage_admins"
on public.moderation_events
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "moderation_events_delete_admins"
on public.moderation_events
for delete
to authenticated
using (public.is_company_admin(company_id));
