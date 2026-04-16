import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { CompanyRole, Database } from "@/lib/supabase/types";

export type AdminCompanyOption = {
  archivedAt: string | null;
  description: string | null;
  id: string;
  name: string;
  role: CompanyRole;
  slug: string;
  website: string | null;
};

export type AdminReferenceOption = {
  id: string;
  label: string;
};

export type AdminWorkspaceContext = {
  companies: AdminCompanyOption[];
  selectedCompany: AdminCompanyOption | null;
  selectedCompanyId: string | null;
  unitOptions: AdminReferenceOption[];
  userId: string | null;
};

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export async function getAdminCompaniesForProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
) {
  const { data: memberships } = await supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("profile_id", profileId)
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: true });

  const companyIds = (memberships ?? []).map((membership) => membership.company_id);

  if (companyIds.length === 0) {
    return [];
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug, archived_at, description, website")
    .in("id", companyIds)
    .order("name", { ascending: true });

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company] as const));

  return (memberships ?? [])
    .map((membership) => {
      const company = companyMap.get(membership.company_id);

      if (!company) {
        return null;
      }

      return {
        archivedAt: company.archived_at,
        description: company.description,
        id: company.id,
        name: company.name,
        role: membership.role,
        slug: company.slug,
        website: company.website,
      };
    })
    .filter((company): company is AdminCompanyOption => company !== null);
}

export const getAdminWorkspaceContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      selectedCompany: null,
      selectedCompanyId: null,
      unitOptions: [],
      userId: null,
    } satisfies AdminWorkspaceContext;
  }

  const supabase = await createClient();
  const companies = await getAdminCompaniesForProfile(supabase, auth.user.id);
  const candidateCompanyId = isUuid(companyId) ? companyId : null;
  const selectedCompanyId = companies.some((company) => company.id === candidateCompanyId)
    ? candidateCompanyId
    : companies.length === 1
      ? companies[0]?.id ?? null
      : null;
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;

  if (!selectedCompany) {
    return {
      companies,
      selectedCompany: null,
      selectedCompanyId: null,
      unitOptions: [],
      userId: auth.user.id,
    } satisfies AdminWorkspaceContext;
  }

  const { data: units } = await supabase
    .from("units")
    .select("id, name")
    .eq("company_id", selectedCompany.id)
    .eq("active", true)
    .order("name", { ascending: true });

  return {
    companies,
    selectedCompany,
    selectedCompanyId,
    unitOptions: (units ?? []).map((unit) => ({ id: unit.id, label: unit.name })),
    userId: auth.user.id,
  } satisfies AdminWorkspaceContext;
});

export const getAdminAccessContext = cache(async () => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      user: auth.user,
    };
  }

  const supabase = await createClient();
  const companies = await getAdminCompaniesForProfile(supabase, auth.user.id);

  return {
    companies,
    user: auth.user,
  };
});
