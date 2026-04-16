import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { getClusterDetailContext } from "@/lib/supabase/clusters";
import type {
  Database,
  DemandKind,
  DemandStatus,
  LookupRow,
} from "@/lib/supabase/types";
import { labelClusterScope } from "@/types/clusters";
import { labelPautaKind, labelPautaStatus, pautaStatusOptions } from "@/types/pautas";
import type { ClusterDetailContext } from "@/lib/supabase/clusters";

export type PautaCompanyOption = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "observer";
  slug: string;
};

export type PautaReferenceOption = {
  id: string;
  label: string;
};

export type PautaListItem = {
  clusterTitle: string | null;
  companyName: string;
  createdAt: string;
  description: string | null;
  href: string;
  id: string;
  kind: DemandKind;
  kindLabel: string;
  priorityLabel: string | null;
  sectorName: string | null;
  status: DemandStatus;
  statusLabel: string;
  supportCount: number;
  title: string;
  unitName: string | null;
  updatedAt: string;
};

export type PautaListContext = {
  companies: PautaCompanyOption[];
  demands: PautaListItem[];
  selectedCompany: PautaCompanyOption | null;
  selectedCompanyId: string | null;
  userId: string | null;
};

export type PautaSupportEntry = {
  createdAt: string;
};

export type PautaHistoryEntry = {
  createdAt: string;
  description: string | null;
  label: string;
};

export type PautaClusterSummary = {
  createdAt: string;
  economicLinkCount: number;
  id: string;
  reportLinkCount: number;
  scopeLabel: string;
  summary: string | null;
  title: string;
};

export type PautaDetailContext = {
  cluster: PautaClusterSummary | null;
  companyId: string;
  companyName: string;
  createdAt: string;
  description: string | null;
  history: PautaHistoryEntry[];
  id: string;
  isCreator: boolean;
  isSupportedByMe: boolean;
  kind: DemandKind;
  kindLabel: string;
  priorityLabel: string | null;
  sectorName: string | null;
  status: DemandStatus;
  statusLabel: string;
  supportCount: number;
  supporters: PautaSupportEntry[];
  title: string;
  unitName: string | null;
  updatedAt: string;
};

export type PautaCreateContext = {
  cluster: ClusterDetailContext;
  companyId: string;
  companyName: string;
  defaultKind: DemandKind;
  sectorOptions: PautaReferenceOption[];
  severityOptions: LookupRow[];
  statusOptions: ReadonlyArray<{ code: DemandStatus; label: string }>;
  unitOptions: PautaReferenceOption[];
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

function mapLookupRows<T extends { code: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.code, row] as const));
}

function labelDemandKind(kind: DemandKind) {
  return labelPautaKind(kind);
}

function labelDemandStatus(status: DemandStatus) {
  return labelPautaStatus(status);
}

function inferDemandKind(cluster: ClusterDetailContext): DemandKind {
  if (cluster.linkedReports.length > 0 && cluster.linkedEconomicReports.length > 0) {
    return "mixed";
  }

  if (cluster.categoryKind === "conditions" || cluster.categoryKind === "economic") {
    return cluster.categoryKind;
  }

  return cluster.linkedEconomicReports.length > 0 ? "economic" : "conditions";
}

async function getMemberCompanies(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<PautaCompanyOption[]> {
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
    .select("id, name, slug")
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
        id: company.id,
        name: company.name,
        role: membership.role,
        slug: company.slug,
      };
    })
    .filter((company): company is PautaCompanyOption => company !== null);
}

async function getReferenceMaps(
  supabase: SupabaseClient<Database>,
  demands: Array<{
    cluster_id: string | null;
    company_id: string;
    priority_code: string | null;
    sector_id: string | null;
    unit_id: string | null;
  }>,
) {
  const unitIds = [...new Set(demands.flatMap((demand) => (demand.unit_id ? [demand.unit_id] : [])))];
  const sectorIds = [
    ...new Set(demands.flatMap((demand) => (demand.sector_id ? [demand.sector_id] : []))),
  ];
  const clusterIds = [
    ...new Set(demands.flatMap((demand) => (demand.cluster_id ? [demand.cluster_id] : []))),
  ];
  const priorityCodes = [
    ...new Set(demands.flatMap((demand) => (demand.priority_code ? [demand.priority_code] : []))),
  ];

  const [unitsResult, sectorsResult, clustersResult, prioritiesResult] = await Promise.all([
    unitIds.length
      ? supabase.from("units").select("id, name").in("id", unitIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    sectorIds.length
      ? supabase.from("sectors").select("id, name").in("id", sectorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    clusterIds.length
      ? supabase.from("issue_clusters").select("id, title").in("id", clusterIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    priorityCodes.length
      ? supabase.from("severity_levels").select("code, label").in("code", priorityCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
  ]);

  return {
    clusters: new Map((clustersResult.data ?? []).map((row) => [row.id, row] as const)),
    priorities: mapLookupRows(prioritiesResult.data),
    sectors: new Map((sectorsResult.data ?? []).map((row) => [row.id, row] as const)),
    units: new Map((unitsResult.data ?? []).map((row) => [row.id, row] as const)),
  };
}

export const getPautaListContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      demands: [],
      selectedCompany: null,
      selectedCompanyId: null,
      userId: null,
    } satisfies PautaListContext;
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
      demands: [],
      selectedCompany: null,
      selectedCompanyId: null,
      userId: auth.user.id,
    } satisfies PautaListContext;
  }

  const [demandsResult, supportersResult] = await Promise.all([
    supabase
      .from("demands")
      .select(
        "id, company_id, cluster_id, unit_id, sector_id, kind, priority_code, status, title, description, created_at, updated_at",
      )
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demand_supporters")
      .select("demand_id")
      .eq("company_id", selectedCompany.id),
  ]);

  const referenceMaps = await getReferenceMaps(supabase, demandsResult.data ?? []);
  const supportCounts = new Map<string, number>();

  for (const supporter of supportersResult.data ?? []) {
    supportCounts.set(
      supporter.demand_id,
      (supportCounts.get(supporter.demand_id) ?? 0) + 1,
    );
  }

  const items = (demandsResult.data ?? []).map((demand) => {
    const cluster = demand.cluster_id ? referenceMaps.clusters.get(demand.cluster_id) ?? null : null;
    const kindLabel = labelDemandKind(demand.kind);
    const statusLabel = labelDemandStatus(demand.status);

    return {
      clusterTitle: cluster?.title ?? null,
      companyName: selectedCompany.name,
      createdAt: demand.created_at,
      description: demand.description,
      href: `/pautas/${demand.id}`,
      id: demand.id,
      kind: demand.kind,
      kindLabel,
      priorityLabel: demand.priority_code
        ? referenceMaps.priorities.get(demand.priority_code)?.label ?? null
        : null,
      sectorName: demand.sector_id ? referenceMaps.sectors.get(demand.sector_id)?.name ?? null : null,
      status: demand.status,
      statusLabel,
      supportCount: supportCounts.get(demand.id) ?? 0,
      title: demand.title,
      unitName: demand.unit_id ? referenceMaps.units.get(demand.unit_id)?.name ?? null : null,
      updatedAt: demand.updated_at,
    } satisfies PautaListItem;
  });

  return {
    companies,
    demands: items,
    selectedCompany,
    selectedCompanyId,
    userId: auth.user.id,
  } satisfies PautaListContext;
});

export const getPautaDetailContext = cache(async (demandId: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured() || !isUuid(demandId)) {
    return null;
  }

  const supabase = await createClient();
  const { data: demand } = await supabase
    .from("demands")
    .select(
      "id, company_id, cluster_id, unit_id, sector_id, kind, priority_code, status, title, description, created_at, updated_at, created_by_profile_id",
    )
    .eq("id", demandId)
    .maybeSingle();

  if (!demand) {
    return null;
  }

  const companies = await getMemberCompanies(supabase, auth.user.id);
  const selectedCompany = companies.find((company) => company.id === demand.company_id) ?? null;

  if (!selectedCompany) {
    return null;
  }

  const [clusterResult, supportersResult, currentSupportResult, referenceMaps] = await Promise.all([
    demand.cluster_id
      ? supabase
          .from("issue_clusters")
          .select("id, title, summary, created_at")
          .eq("id", demand.cluster_id)
          .maybeSingle()
      : Promise.resolve({ data: null as null | { id: string; title: string; summary: string | null; created_at: string } }),
    supabase
      .from("demand_supporters")
      .select("profile_id, created_at")
      .eq("company_id", demand.company_id)
      .eq("demand_id", demand.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("demand_supporters")
      .select("profile_id")
      .eq("company_id", demand.company_id)
      .eq("demand_id", demand.id)
      .eq("profile_id", auth.user.id)
      .maybeSingle(),
    getReferenceMaps(supabase, [
      {
        cluster_id: demand.cluster_id,
        company_id: demand.company_id,
        priority_code: demand.priority_code,
        sector_id: demand.sector_id,
        unit_id: demand.unit_id,
      },
    ]),
  ]);

  const cluster = clusterResult.data
    ? ({
        createdAt: clusterResult.data.created_at,
        economicLinkCount: 0,
        id: clusterResult.data.id,
        reportLinkCount: 0,
        scopeLabel: "Sem classificação",
        summary: clusterResult.data.summary,
        title: clusterResult.data.title,
      } satisfies PautaClusterSummary)
    : null;

  if (cluster && demand.cluster_id) {
    const [reportLinksResult, economicLinksResult] = await Promise.all([
      supabase
        .from("cluster_reports")
        .select("cluster_id")
        .eq("cluster_id", demand.cluster_id)
        .eq("company_id", demand.company_id),
      supabase
        .from("cluster_economic_reports")
        .select("cluster_id")
        .eq("cluster_id", demand.cluster_id)
        .eq("company_id", demand.company_id),
    ]);

    cluster.reportLinkCount = reportLinksResult.data?.length ?? 0;
    cluster.economicLinkCount = economicLinksResult.data?.length ?? 0;
    if (cluster.reportLinkCount > 0 && cluster.economicLinkCount > 0) {
      cluster.scopeLabel = labelClusterScope("mixed");
    } else if (cluster.economicLinkCount > 0) {
      cluster.scopeLabel = labelClusterScope("economic");
    } else {
      cluster.scopeLabel = labelClusterScope("conditions");
    }
  }

  const supportEntries = (supportersResult.data ?? []).map((row) => ({
    createdAt: row.created_at,
  }));

  const history: PautaHistoryEntry[] = [
    {
      createdAt: demand.created_at,
      description: cluster
        ? `Criada a partir do cluster "${cluster.title}".`
        : "Criada sem cluster de origem vinculado.",
      label: "Criação",
    },
    {
      createdAt: demand.updated_at,
      description: "Última atualização registrada no sistema.",
      label: "Atualização",
    },
    ...supportEntries.map((entry, index) => ({
      createdAt: entry.createdAt,
      description: "Apoio registrado por usuário autenticado.",
      label: `Apoio ${index + 1}`,
    })),
  ];

  return {
    cluster,
    companyId: demand.company_id,
    companyName: selectedCompany.name,
    createdAt: demand.created_at,
    description: demand.description,
    history: history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    id: demand.id,
    isCreator: demand.created_by_profile_id === auth.user.id,
    isSupportedByMe: Boolean(currentSupportResult.data),
    kind: demand.kind,
    kindLabel: labelDemandKind(demand.kind),
    priorityLabel: demand.priority_code
      ? referenceMaps.priorities.get(demand.priority_code)?.label ?? null
      : null,
    sectorName: demand.sector_id ? referenceMaps.sectors.get(demand.sector_id)?.name ?? null : null,
    status: demand.status,
    statusLabel: labelDemandStatus(demand.status),
    supportCount: supportEntries.length,
    supporters: supportEntries,
    title: demand.title,
    unitName: demand.unit_id ? referenceMaps.units.get(demand.unit_id)?.name ?? null : null,
    updatedAt: demand.updated_at,
  } satisfies PautaDetailContext;
});

export const getPautaCreateContext = cache(async (clusterId: string) => {
  const cluster = await getClusterSummaryForCreate(clusterId);

  if (!cluster) {
    return null;
  }

  const workspace = await getAdminWorkspaceContext(cluster.companyId);
  if (!workspace.selectedCompany) {
    return null;
  }

  const supabase = await createClient();
  const [unitOptionsResult, sectorOptionsResult, severityOptionsResult] = await Promise.all([
    supabase
      .from("units")
      .select("id, name")
      .eq("company_id", workspace.selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("sectors")
      .select("id, name")
      .eq("company_id", workspace.selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("severity_levels")
      .select("code, label, active, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    cluster,
    companyId: workspace.selectedCompany.id,
    companyName: workspace.selectedCompany.name,
    defaultKind: inferDemandKind(cluster),
    sectorOptions: (sectorOptionsResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    severityOptions: (severityOptionsResult.data ?? []).map((row) => row),
    statusOptions: pautaStatusOptions,
    unitOptions: (unitOptionsResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
  } satisfies PautaCreateContext;
});

async function getClusterSummaryForCreate(clusterId: string): Promise<ClusterDetailContext | null> {
  return getClusterDetailContext(clusterId);
}
