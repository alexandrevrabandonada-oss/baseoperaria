import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { CompanyRole, Database, DemandKind, DemandStatus } from "@/lib/supabase/types";
import { clusterStatusOptions } from "@/types/clusters";
import { pautaKindOptions, pautaStatusOptions } from "@/types/pautas";

export type RadarCompanyOption = {
  id: string;
  name: string;
  role: CompanyRole;
  slug: string;
};

export type RadarBreakdownItem = {
  count: number;
  label: string;
};

export type RadarSummaryCard = {
  hint: string;
  label: string;
  value: string;
};

export type RadarClusterItem = {
  economicLinkCount: number;
  id: string;
  reportLinkCount: number;
  scopeLabel: string;
  status: string;
  statusLabel: string;
  summary: string | null;
  title: string;
  totalLinkCount: number;
  updatedAt: string;
};

export type RadarDemandItem = {
  clusterTitle: string | null;
  companyName: string;
  href: string;
  id: string;
  kind: DemandKind;
  kindLabel: string;
  priorityLabel: string | null;
  priorityScore: number;
  sectorName: string | null;
  status: DemandStatus;
  statusLabel: string;
  supportCount: number;
  title: string;
  unitName: string | null;
  updatedAt: string;
};

export type RadarContext = {
  categoryBreakdown: RadarBreakdownItem[];
  companies: RadarCompanyOption[];
  economicContractBreakdown: RadarBreakdownItem[];
  economicIssueBreakdown: RadarBreakdownItem[];
  economicSalaryBreakdown: RadarBreakdownItem[];
  selectedCompany: RadarCompanyOption | null;
  selectedCompanyId: string | null;
  sectorBreakdown: RadarBreakdownItem[];
  shiftBreakdown: RadarBreakdownItem[];
  summaryCards: RadarSummaryCard[];
  topClusters: RadarClusterItem[];
  priorityDemands: RadarDemandItem[];
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

function mapRowsById<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row] as const));
}

function mapRowsByCode<T extends { code: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.code, row] as const));
}

function sortBreakdown(items: RadarBreakdownItem[]) {
  return items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

function aggregateCounts(rows: Array<string | null | undefined>, fallbackLabel: string) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = row?.trim() || fallbackLabel;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return sortBreakdown(
    [...counts.entries()].map(([label, count]) => ({
      count,
      label,
    })),
  );
}

async function getMemberCompanies(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<RadarCompanyOption[]> {
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
    .filter((company): company is RadarCompanyOption => company !== null);
}

function labelSeverity(code: string | null, severityMap: Map<string, { label: string }>) {
  return code ? severityMap.get(code)?.label ?? null : null;
}

function rankDemand(priorityCode: string | null, supportCount: number) {
  const severityRanks = new Map([
    ["critical", 4],
    ["high", 3],
    ["medium", 2],
    ["low", 1],
  ]);

  return (severityRanks.get(priorityCode ?? "") ?? 0) * 10 + Math.min(supportCount, 9);
}

export const getRadarDashboardContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      categoryBreakdown: [],
      companies: [],
      economicContractBreakdown: [],
      economicIssueBreakdown: [],
      economicSalaryBreakdown: [],
      selectedCompany: null,
      selectedCompanyId: null,
      sectorBreakdown: [],
      shiftBreakdown: [],
      summaryCards: [],
      topClusters: [],
      priorityDemands: [],
      userId: null,
    } satisfies RadarContext;
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
      categoryBreakdown: [],
      companies,
      economicContractBreakdown: [],
      economicIssueBreakdown: [],
      economicSalaryBreakdown: [],
      selectedCompany: null,
      selectedCompanyId,
      sectorBreakdown: [],
      shiftBreakdown: [],
      summaryCards: [],
      topClusters: [],
      priorityDemands: [],
      userId: auth.user.id,
    } satisfies RadarContext;
  }

  const [
    reportsResult,
    economicReportsResult,
    clustersResult,
    demandsResult,
    supportersResult,
    categoriesResult,
    unitsResult,
    sectorsResult,
    shiftsResult,
    issueTypesResult,
    salaryBandsResult,
    contractTypesResult,
    severityLevelsResult,
    reportClusterLinksResult,
    economicClusterLinksResult,
  ] = await Promise.all([
    supabase
      .from("reports")
      .select("category_id, sector_id, shift_id")
      .eq("company_id", selectedCompany.id),
    supabase
      .from("economic_reports")
      .select("category_id, contract_type_code, issue_type_code, salary_band_code, sector_id, shift_id, severity_code")
      .eq("company_id", selectedCompany.id),
    supabase
      .from("issue_clusters")
      .select("id, title, summary, status, updated_at")
      .eq("company_id", selectedCompany.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("demands")
      .select("id, cluster_id, company_id, kind, priority_code, sector_id, status, title, unit_id, updated_at, created_at")
      .eq("company_id", selectedCompany.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("demand_supporters")
      .select("demand_id")
      .eq("company_id", selectedCompany.id),
    supabase
      .from("report_categories")
      .select("id, name, category_kind")
      .eq("company_id", selectedCompany.id)
      .eq("active", true)
      .order("category_kind", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("units")
      .select("id, name")
      .eq("company_id", selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("sectors")
      .select("id, name")
      .eq("company_id", selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("shifts")
      .select("id, name")
      .eq("company_id", selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("issue_types")
      .select("code, label, sort_order, active")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("salary_bands")
      .select("code, label, sort_order, active")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("contract_types")
      .select("code, label, sort_order, active")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("severity_levels")
      .select("code, label, sort_order, active")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("cluster_reports").select("cluster_id").eq("company_id", selectedCompany.id),
    supabase.from("cluster_economic_reports").select("cluster_id").eq("company_id", selectedCompany.id),
  ]);

  const categoryMap = mapRowsById(categoriesResult.data);
  const clusterMap = mapRowsById(clustersResult.data);
  const unitMap = mapRowsById(unitsResult.data);
  const sectorMap = mapRowsById(sectorsResult.data);
  const shiftMap = mapRowsById(shiftsResult.data);
  const issueTypeMap = mapRowsByCode(issueTypesResult.data);
  const salaryBandMap = mapRowsByCode(salaryBandsResult.data);
  const contractTypeMap = mapRowsByCode(contractTypesResult.data);
  const severityMap = new Map(
    (severityLevelsResult.data ?? []).map((row) => [row.code, { label: row.label }] as const),
  );

  const categoryBreakdown = aggregateCounts(
    [
      ...(reportsResult.data ?? []).map((row) => categoryMap.get(row.category_id ?? "")?.name ?? null),
      ...(economicReportsResult.data ?? []).map((row) => categoryMap.get(row.category_id ?? "")?.name ?? null),
    ],
    "Sem categoria",
  );

  const sectorBreakdown = aggregateCounts(
    [
      ...(reportsResult.data ?? []).map((row) => sectorMap.get(row.sector_id ?? "")?.name ?? null),
      ...(economicReportsResult.data ?? []).map((row) => sectorMap.get(row.sector_id ?? "")?.name ?? null),
    ],
    "Sem setor",
  );

  const shiftBreakdown = aggregateCounts(
    [
      ...(reportsResult.data ?? []).map((row) => shiftMap.get(row.shift_id ?? "")?.name ?? null),
      ...(economicReportsResult.data ?? []).map((row) => shiftMap.get(row.shift_id ?? "")?.name ?? null),
    ],
    "Sem turno",
  );

  const economicIssueBreakdown = aggregateCounts(
    (economicReportsResult.data ?? []).map((row) => issueTypeMap.get(row.issue_type_code ?? "")?.label ?? null),
    "Sem tipo",
  );

  const economicSalaryBreakdown = aggregateCounts(
    (economicReportsResult.data ?? []).map((row) => salaryBandMap.get(row.salary_band_code ?? "")?.label ?? null),
    "Sem faixa",
  );

  const economicContractBreakdown = aggregateCounts(
    (economicReportsResult.data ?? []).map((row) => contractTypeMap.get(row.contract_type_code ?? "")?.label ?? null),
    "Sem vínculo",
  );

  const reportLinkCounts = new Map<string, number>();
  const economicLinkCounts = new Map<string, number>();

  for (const row of reportClusterLinksResult.data ?? []) {
    reportLinkCounts.set(row.cluster_id, (reportLinkCounts.get(row.cluster_id) ?? 0) + 1);
  }

  for (const row of economicClusterLinksResult.data ?? []) {
    economicLinkCounts.set(row.cluster_id, (economicLinkCounts.get(row.cluster_id) ?? 0) + 1);
  }

  const topClusters = (clustersResult.data ?? [])
    .map((cluster) => {
      const reportLinkCount = reportLinkCounts.get(cluster.id) ?? 0;
      const economicLinkCount = economicLinkCounts.get(cluster.id) ?? 0;
      const totalLinkCount = reportLinkCount + economicLinkCount;
      return {
        economicLinkCount,
        id: cluster.id,
        reportLinkCount,
        scopeLabel:
          reportLinkCount > 0 && economicLinkCount > 0
            ? "Misto"
            : economicLinkCount > 0
              ? "Econômico"
              : reportLinkCount > 0
                ? "Condição"
                : "Sem vínculos",
        status: cluster.status,
        statusLabel: clusterStatusOptions.find((option) => option.code === cluster.status)?.label ?? cluster.status,
        summary: cluster.summary,
        title: cluster.title,
        totalLinkCount,
        updatedAt: cluster.updated_at,
      } satisfies RadarClusterItem;
    })
    .filter((cluster) => cluster.totalLinkCount > 0)
    .sort((a, b) => b.totalLinkCount - a.totalLinkCount || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const supportCounts = new Map<string, number>();
  for (const supporter of supportersResult.data ?? []) {
    supportCounts.set(supporter.demand_id, (supportCounts.get(supporter.demand_id) ?? 0) + 1);
  }

  const priorityDemands = (demandsResult.data ?? [])
    .filter((demand) => demand.status !== "completed" && demand.status !== "cancelled")
    .map((demand) => {
      const severityLabel = labelSeverity(demand.priority_code, severityMap);
      const supportCount = supportCounts.get(demand.id) ?? 0;
      const priorityScore = rankDemand(demand.priority_code, supportCount);
      return {
        clusterTitle: demand.cluster_id ? clusterMap.get(demand.cluster_id)?.title ?? null : null,
        companyName: selectedCompany.name,
        href: `/pautas/${demand.id}`,
        id: demand.id,
        kind: demand.kind,
        kindLabel: pautaKindOptions.find((option) => option.code === demand.kind)?.label ?? demand.kind,
        priorityLabel: severityLabel,
        priorityScore,
        sectorName: demand.sector_id ? sectorMap.get(demand.sector_id)?.name ?? null : null,
        status: demand.status,
        statusLabel: pautaStatusOptions.find((option) => option.code === demand.status)?.label ?? demand.status,
        supportCount,
        title: demand.title,
        unitName: demand.unit_id ? unitMap.get(demand.unit_id)?.name ?? null : null,
        updatedAt: demand.updated_at,
      } satisfies RadarDemandItem;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const summaryCards: RadarSummaryCard[] = [
    {
      hint: "Registros de condições e econômicos combinados no escopo.",
      label: "Sinais capturados",
      value: String((reportsResult.data?.length ?? 0) + (economicReportsResult.data?.length ?? 0)),
    },
    {
      hint: "Categorias com maior volume no recorte atual.",
      label: "Categorias ativas",
      value: String(categoryBreakdown.length),
    },
    {
      hint: "Clusters já com vínculo manual.",
      label: "Clusters relevantes",
      value: String(topClusters.length),
    },
    {
      hint: "Pautas em acompanhamento ativo.",
      label: "Pautas prioritárias",
      value: String(priorityDemands.length),
    },
  ];

  return {
    categoryBreakdown,
    companies,
    economicContractBreakdown,
    economicIssueBreakdown,
    economicSalaryBreakdown,
    selectedCompany,
    selectedCompanyId,
    sectorBreakdown,
    shiftBreakdown,
    summaryCards,
    topClusters,
    priorityDemands,
    userId: auth.user.id,
  } satisfies RadarContext;
});
