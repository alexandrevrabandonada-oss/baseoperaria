drop policy if exists "profiles_select_company_members" on public.profiles;
create policy "profiles_select_company_members"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.profile_id = profiles.id
      and public.is_company_member(cm.company_id)
  )
);

drop policy if exists "nuclei_insert_members" on public.nuclei;
drop policy if exists "nuclei_insert_admins" on public.nuclei;
create policy "nuclei_insert_admins"
on public.nuclei
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and public.is_current_profile(created_by_profile_id)
);
