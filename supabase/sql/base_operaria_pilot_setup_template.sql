-- Base Operaria pilot setup
-- Run this after:
-- 1. base_operaria_bootstrap.sql
-- 2. base_operaria_authz.sql
-- 3. base_operaria_first_access_template.sql
--
-- Goal:
-- - create a minimal operational structure for one pilot company
-- - add at least one unit, one sector, one shift and starter categories

do $$
declare
  target_company_slug text := 'empresa-piloto';
  target_creator_profile_id uuid := '2729fb9d-7cc1-4d34-a5d1-542a5d308dc3';
  target_company_id uuid;
  target_unit_id uuid;
begin
  select id
  into target_company_id
  from public.companies
  where slug = target_company_slug;

  if target_company_id is null then
    raise exception 'Empresa com slug % nao encontrada. Rode primeiro o script de first access.', target_company_slug;
  end if;

  insert into public.units (
    company_id,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values (
    target_company_id,
    'Unidade Principal',
    'unidade-principal',
    'Unidade inicial do piloto',
    target_creator_profile_id,
    true
  )
  on conflict (company_id, code) do update
    set name = excluded.name,
        description = excluded.description,
        active = true,
        updated_at = timezone('utc', now())
  returning id into target_unit_id;

  if target_unit_id is null then
    select id
    into target_unit_id
    from public.units
    where company_id = target_company_id
      and code = 'unidade-principal';
  end if;

  insert into public.sectors (
    company_id,
    unit_id,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      target_unit_id,
      'Producao',
      'producao',
      'Setor inicial de producao',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      target_unit_id,
      'Expedicao',
      'expedicao',
      'Setor inicial de expedicao',
      target_creator_profile_id,
      true
    )
  on conflict (company_id, code) do update
    set name = excluded.name,
        description = excluded.description,
        unit_id = excluded.unit_id,
        active = true,
        updated_at = timezone('utc', now());

  insert into public.shifts (
    company_id,
    unit_id,
    name,
    code,
    start_time,
    end_time,
    overnight,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      target_unit_id,
      'Dia',
      'dia',
      '08:00',
      '17:00',
      false,
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      target_unit_id,
      'Noite',
      'noite',
      '22:00',
      '06:00',
      true,
      target_creator_profile_id,
      true
    )
  on conflict (company_id, code) do update
    set name = excluded.name,
        unit_id = excluded.unit_id,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        overnight = excluded.overnight,
        active = true,
        updated_at = timezone('utc', now());

  insert into public.report_categories (
    company_id,
    category_kind,
    name,
    code,
    description,
    created_by_profile_id,
    active
  )
  values
    (
      target_company_id,
      'conditions',
      'Ritmo e carga',
      'ritmo-carga',
      'Problemas de ritmo, aculo e pressao cotidiana',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'conditions',
      'Seguranca e risco',
      'seguranca-risco',
      'Problemas de seguranca, risco e exposicao',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'conditions',
      'Chefia e assedio',
      'chefia-assedio',
      'Problemas de assedio, pressao e abuso de chefia',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Salario e desconto',
      'salario-desconto',
      'Salario baixo, atraso, desconto e nao pagamento',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Desvio de funcao',
      'desvio-funcao',
      'Funcao real diferente do cargo formal',
      target_creator_profile_id,
      true
    ),
    (
      target_company_id,
      'economic',
      'Beneficio e vinculo',
      'beneficio-vinculo',
      'Problemas com beneficio, contrato e vinculo de trabalho',
      target_creator_profile_id,
      true
    )
  on conflict (company_id, category_kind, code) do update
    set name = excluded.name,
        description = excluded.description,
        active = true,
        updated_at = timezone('utc', now());
end;
$$;