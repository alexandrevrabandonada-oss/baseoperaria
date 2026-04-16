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

alter table public.company_memberships
  drop constraint if exists company_memberships_role_check;

alter table public.company_memberships
  add constraint company_memberships_role_check
  check (role in ('owner', 'admin', 'moderator', 'member', 'observer'));

create index if not exists moderation_events_company_created_idx
  on public.moderation_events (company_id, created_at desc);

create index if not exists moderation_events_entity_created_idx
  on public.moderation_events (company_id, entity_type, entity_id, created_at desc);

create policy "reports_manage_moderators"
on public.reports
for update
to authenticated
using (public.is_company_moderator(company_id))
with check (public.is_company_moderator(company_id));

create policy "economic_reports_manage_moderators"
on public.economic_reports
for update
to authenticated
using (public.is_company_moderator(company_id))
with check (public.is_company_moderator(company_id));

create policy "cluster_reports_insert_moderators"
on public.cluster_reports
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "cluster_reports_delete_moderators"
on public.cluster_reports
for delete
to authenticated
using (public.is_company_moderator(company_id));

create policy "cluster_economic_reports_insert_moderators"
on public.cluster_economic_reports
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(created_by_profile_id)
);

create policy "cluster_economic_reports_delete_moderators"
on public.cluster_economic_reports
for delete
to authenticated
using (public.is_company_moderator(company_id));

create policy "moderation_events_select_moderators"
on public.moderation_events
for select
to authenticated
using (public.is_company_moderator(company_id));

create policy "moderation_events_insert_moderators"
on public.moderation_events
for insert
to authenticated
with check (
  public.is_company_moderator(company_id)
  and public.is_current_profile(actor_profile_id)
);
