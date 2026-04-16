-- Base Operaria first access bootstrap
-- Edit the constants below and run after:
-- 1. base_operaria_bootstrap.sql
-- 2. base_operaria_authz.sql
--
-- Goal:
-- - create/update the user's profile row in public.profiles
-- - create the first company
-- - let the trigger create owner membership automatically

do $$
declare
  target_user_id uuid := '2729fb9d-7cc1-4d34-a5d1-542a5d308dc3';
  target_pseudonym text := 'Alexandre';
  target_initial_link text := 'base';
  target_company_name text := 'Empresa Piloto';
  target_company_slug text := 'empresa-piloto';
  target_company_description text := 'Empresa inicial da Base Operaria';
begin
  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'O usuario % nao existe em auth.users', target_user_id;
  end if;

  insert into public.profiles (id, pseudonym, initial_link)
  values (target_user_id, target_pseudonym, target_initial_link)
  on conflict (id) do update
    set pseudonym = excluded.pseudonym,
        initial_link = excluded.initial_link,
        updated_at = timezone('utc', now());

  insert into public.companies (
    name,
    slug,
    description,
    created_by_profile_id
  )
  values (
    target_company_name,
    target_company_slug,
    target_company_description,
    target_user_id
  )
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        updated_at = timezone('utc', now());
end;
$$;

-- Optional promotion examples:
-- update public.company_memberships
-- set role = 'admin', updated_at = timezone('utc', now())
-- where company_id = '<company-id>' and profile_id = '<profile-id>';
--
-- update public.company_memberships
-- set role = 'moderator', updated_at = timezone('utc', now())
-- where company_id = '<company-id>' and profile_id = '<profile-id>';