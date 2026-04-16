import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionStatus,
  ActionType,
  Database,
  DemandStatus,
  NucleusMemberRole,
  NucleusScopeKind,
  NucleusStatus,
  ReportStatus,
} from "@/lib/supabase/types";
import {
  nucleusActionStatusOptions,
  nucleusActionTypeOptions,
  nucleusMemberRoleOptions,
  nucleusStatusOptions,
} from "@/types/nucleos";
import type { AdminCompanyOption, AdminReferenceOption } from "@/lib/supabase/admin";

export type NucleusCompanyOption = AdminCompanyOption;

type CompanyMembershipWithProfile = {
  profile_id: string;
  role: NucleusMemberRole;
  profiles: {
    id: string;
    pseudonym: string;
  } | null;
};

type NucleusMemberWithProfile = {
  company_id: string;
  created_at: string;
  nucleus_id: string;
  profile_id: string;
  role: NucleusMemberRole;
  profiles: {
    id: string;
    pseudonym: string;
  } | null;
};

export type NucleusListItem = {
  actionCount: number;
  companyName: string;
  createdAt: string;
  description: string | null;
  href: string;
  id: string;
  linkedDemandCount: number;
  memberCount: number;
  scopeLabel: string;
  scopeKind: NucleusScopeKind;
  status: NucleusStatus;
  statusLabel: string;
  title: string;
  updatedAt: string;
};

export type NucleusListContext = {
  companies: NucleusCompanyOption[];
  nuclei: NucleusListItem[];
  selectedCompany: NucleusCompanyOption | null;
  selectedCompanyId: string | null;
  userId: string | null;
};

export type NucleusMemberItem = {
  createdAt: string;
  id: string;
  isCurrentUser: boolean;
  pseudonym: string;
  role: NucleusMemberRole;
};

export type NucleusLinkedDemandItem = {
  actionCount: number;
  href: string;
  id: string;
  status: DemandStatus;
  statusLabel: string;
  title: string;
};

export type NucleusActionItem = {
  actionType: ActionType;
  actionTypeLabel: string;
  createdAt: string;
  demandHref: string | null;
  demandTitle: string | null;
  details: string | null;
  id: string;
  scheduledAt: string | null;
  status: ActionStatus;
  statusLabel: string;
  title: string;
};

export type NucleusCompanyMemberOption = {
  id: string;
  label: string;
  meta: string | null;
};

export type NucleusDetailContext = {
  actions: NucleusActionItem[];
  availableMemberOptions: NucleusCompanyMemberOption[];
  availableDemandOptions: NucleusCompanyMemberOption[];
  companyId: string;
  companyName: string;
  companyRole: NucleusCompanyOption["role"];
  createdAt: string;
  createdByCurrentUser: boolean;
  description: string | null;
  id: string;
  isMember: boolean;
  linkedDemands: NucleusLinkedDemandItem[];
  memberCount: number;
  members: NucleusMemberItem[];
  scopeKind: NucleusScopeKind;
  scopeLabel: string;
  sectorName: string | null;
  status: NucleusStatus;
  statusLabel: string;
  theme: string | null;
  title: string;
  updatedAt: string;
};

export type NucleusCreateContext = {
  companyId: string;
  companyName: string;
  defaultScopeKind: NucleusScopeKind;
  sectorOptions: AdminReferenceOption[];
};

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function mapRowsById<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row] as const));
}

function labelStatus(status: NucleusStatus | ReportStatus | ActionStatus) {
  return nucleusStatusOptions.find((option) => option.code === status)?.label ?? status;
}

function labelActionStatus(status: ActionStatus) {
  return nucleusActionStatusOptions.find((option) => option.code === status)?.label ?? status;
}

function labelScope(
  scopeKind: NucleusScopeKind,
  sectorName: string | null,
  theme: string | null,
) {
  if (scopeKind === "sector") {
    return sectorName ? `Setor · ${sectorName}` : "Setor";
  }

  return theme ? `Tema · ${theme}` : "Tema";
}

async function getMemberCompanies(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<NucleusCompanyOption[]> {
  const { data: memberships } = await supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("profile_id", profileId)
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

  const companyMap = mapRowsById(companies);

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
    .filter((company): company is NucleusCompanyOption => company !== null);
}

async function getCompanyMembers(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  const { data } = await supabase
    .from("company_memberships")
    .select("profile_id, role, profiles(id, pseudonym)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as CompanyMembershipWithProfile[])
    .map((membership) => ({
      id: membership.profile_id,
      label: membership.profiles?.pseudonym ?? membership.profile_id,
      meta:
        nucleusMemberRoleOptions.find((option) => option.code === membership.role)?.label ?? null,
    }))
    .filter((member) => Boolean(member.label)) as NucleusCompanyMemberOption[];
}

async function getSectorMap(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  const { data } = await supabase
    .from("sectors")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true });

  return mapRowsById(data);
}

export const getNucleusListContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      nuclei: [],
      selectedCompany: null,
      selectedCompanyId: null,
      userId: null,
    } satisfies NucleusListContext;
  }

  const supabase = await createClient();
  const companies = await getMemberCompanies(supabase, auth.user.id);
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
      nuclei: [],
      selectedCompany: null,
      selectedCompanyId: null,
      userId: auth.user.id,
    } satisfies NucleusListContext;
  }

  const [nucleiResult, membersResult, actionsResult, sectorsResult] = await Promise.all([
    supabase
      .from("nuclei")
      .select(
        "id, company_id, name, description, scope_kind, sector_id, theme, status, created_at, updated_at",
      )
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("nucleus_members")
      .select("nucleus_id")
      .eq("company_id", selectedCompany.id),
    supabase
      .from("actions")
      .select("id, nucleus_id, demand_id")
      .eq("company_id", selectedCompany.id),
    getSectorMap(supabase, selectedCompany.id),
  ]);

  const memberCounts = new Map<string, number>();
  for (const member of membersResult.data ?? []) {
    memberCounts.set(member.nucleus_id, (memberCounts.get(member.nucleus_id) ?? 0) + 1);
  }

  const actionCounts = new Map<string, number>();
  const linkedDemandCounts = new Map<string, number>();
  for (const action of actionsResult.data ?? []) {
    if (!action.nucleus_id) {
      continue;
    }

    actionCounts.set(action.nucleus_id, (actionCounts.get(action.nucleus_id) ?? 0) + 1);

    if (action.demand_id) {
      linkedDemandCounts.set(
        action.nucleus_id,
        (linkedDemandCounts.get(action.nucleus_id) ?? 0) + 1,
      );
    }
  }

  const nuclei = (nucleiResult.data ?? []).map((nucleus) => ({
    actionCount: actionCounts.get(nucleus.id) ?? 0,
    companyName: selectedCompany.name,
    createdAt: nucleus.created_at,
    description: nucleus.description,
    href: `/nucleos/${nucleus.id}`,
    id: nucleus.id,
    linkedDemandCount: linkedDemandCounts.get(nucleus.id) ?? 0,
    memberCount: memberCounts.get(nucleus.id) ?? 0,
    scopeKind: nucleus.scope_kind,
    scopeLabel: labelScope(
      nucleus.scope_kind,
      nucleus.sector_id ? sectorsResult.get(nucleus.sector_id)?.name ?? null : null,
      nucleus.theme,
    ),
    status: nucleus.status,
    statusLabel: labelStatus(nucleus.status),
    title: nucleus.name,
    updatedAt: nucleus.updated_at,
  } satisfies NucleusListItem));

  return {
    companies,
    nuclei,
    selectedCompany,
    selectedCompanyId,
    userId: auth.user.id,
  } satisfies NucleusListContext;
});

export const getNucleusCreateContext = cache(async (companyId: string) => {
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.selectedCompany) {
    return null;
  }

  const supabase = await createClient();
  const sectors = await getSectorMap(supabase, workspace.selectedCompany.id);

  return {
    companyId: workspace.selectedCompany.id,
    companyName: workspace.selectedCompany.name,
    defaultScopeKind: sectors.size > 0 ? "sector" : "theme",
    sectorOptions: [...sectors.values()].map((sector) => ({ id: sector.id, label: sector.name })),
  } satisfies NucleusCreateContext;
});

export const getNucleusDetailContext = cache(async (nucleusId: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured() || !isUuid(nucleusId)) {
    return null;
  }

  const supabase = await createClient();
  const { data: nucleus } = await supabase
    .from("nuclei")
    .select(
      "id, company_id, name, description, scope_kind, sector_id, theme, status, created_at, updated_at, created_by_profile_id",
    )
    .eq("id", nucleusId)
    .maybeSingle();

  if (!nucleus) {
    return null;
  }

  const companies = await getMemberCompanies(supabase, auth.user.id);
  const selectedCompany = companies.find((company) => company.id === nucleus.company_id) ?? null;
  if (!selectedCompany) {
    return null;
  }

  const [sectorMap, membersResult, actionsResult, demandsResult, companyMembersResult] =
    await Promise.all([
      getSectorMap(supabase, nucleus.company_id),
      supabase
        .from("nucleus_members")
        .select("nucleus_id, company_id, profile_id, role, created_at, profiles(id, pseudonym)")
        .eq("nucleus_id", nucleus.id)
        .eq("company_id", nucleus.company_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("actions")
        .select(
          "id, company_id, nucleus_id, demand_id, title, details, action_type, status, scheduled_at, completed_at, created_at",
        )
        .eq("nucleus_id", nucleus.id)
        .eq("company_id", nucleus.company_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("demands")
        .select("id, company_id, title, status, created_at")
        .eq("company_id", nucleus.company_id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(40),
      getCompanyMembers(supabase, nucleus.company_id),
    ]);

  const memberItems = ((membersResult.data ?? []) as NucleusMemberWithProfile[]).map((member) => ({
    createdAt: member.created_at,
    id: member.profile_id,
    isCurrentUser: member.profile_id === auth.user.id,
    pseudonym: member.profiles?.pseudonym ?? "Membro",
    role: member.role,
  }));

  const actionList = actionsResult.data ?? [];
  const demandIds = [...new Set(actionList.flatMap((action) => (action.demand_id ? [action.demand_id] : [])))];
  const demandMap = new Map(
    (demandsResult.data ?? [])
      .filter((demand) => demandIds.includes(demand.id))
      .map((demand) => [demand.id, demand] as const),
  );
  const actionCountByDemand = new Map<string, number>();

  for (const action of actionList) {
    if (!action.demand_id) {
      continue;
    }

    actionCountByDemand.set(
      action.demand_id,
      (actionCountByDemand.get(action.demand_id) ?? 0) + 1,
    );
  }

  const linkedDemands = [...demandMap.values()].map((demand) => ({
    actionCount: actionCountByDemand.get(demand.id) ?? 0,
    href: `/pautas/${demand.id}`,
    id: demand.id,
    status: demand.status,
    statusLabel:
      demand.status === "draft"
        ? "Rascunho"
        : demand.status === "open"
          ? "Aberta"
          : demand.status === "planned"
            ? "Planejada"
            : demand.status === "in_progress"
              ? "Em andamento"
              : demand.status === "completed"
                ? "Concluída"
                : "Cancelada",
    title: demand.title,
  }));

  const actions = actionList.map((action) => ({
    actionType: action.action_type,
    actionTypeLabel:
      nucleusActionTypeOptions.find((option) => option.code === action.action_type)?.label ??
      action.action_type,
    createdAt: action.created_at,
    demandHref: action.demand_id ? `/pautas/${action.demand_id}` : null,
    demandTitle: action.demand_id ? demandMap.get(action.demand_id)?.title ?? null : null,
    details: action.details,
    id: action.id,
    scheduledAt: action.scheduled_at,
    status: action.status,
    statusLabel: labelActionStatus(action.status),
    title: action.title,
  }));

  const sectorName = nucleus.sector_id ? sectorMap.get(nucleus.sector_id)?.name ?? null : null;
  const scopeLabel = labelScope(nucleus.scope_kind, sectorName, nucleus.theme);
  const memberCount = memberItems.length;
  const isMember = memberItems.some((member) => member.id === auth.user.id);
  const companyRole = selectedCompany.role;
  const availableMemberOptions = companyMembersResult
    .filter((member) => !memberItems.some((current) => current.id === member.id))
    .filter((member) => member.id !== auth.user.id || !isMember)
    .map((member) => ({
      id: member.id,
      label: member.label,
      meta: member.meta,
    }));
  const availableDemandOptions = (demandsResult.data ?? []).map((demand) => ({
    id: demand.id,
    label: demand.title,
    meta:
      demand.status === "draft"
        ? "Rascunho"
        : demand.status === "open"
          ? "Aberta"
          : demand.status === "planned"
            ? "Planejada"
            : demand.status === "in_progress"
              ? "Em andamento"
              : demand.status === "completed"
                ? "Concluída"
                : "Cancelada",
  }));

  return {
    actions,
    availableMemberOptions,
    availableDemandOptions,
    companyId: nucleus.company_id,
    companyName: selectedCompany.name,
    companyRole,
    createdAt: nucleus.created_at,
    createdByCurrentUser: nucleus.created_by_profile_id === auth.user.id,
    description: nucleus.description,
    id: nucleus.id,
    isMember,
    linkedDemands,
    memberCount,
    members: memberItems,
    scopeKind: nucleus.scope_kind,
    scopeLabel,
    sectorName,
    status: nucleus.status,
    statusLabel: labelStatus(nucleus.status),
    theme: nucleus.theme,
    title: nucleus.name,
    updatedAt: nucleus.updated_at,
  } satisfies NucleusDetailContext;
});
