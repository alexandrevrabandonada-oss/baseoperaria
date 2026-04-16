import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getModerationTrailForEntity,
  getModerationWorkspaceContext,
  type ModerationTrailItem,
} from "@/lib/supabase/moderation";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { AdminCompanyOption } from "@/lib/supabase/admin";
import type {
  Database,
  ReportCategoryKind,
  ReportStatus,
} from "@/lib/supabase/types";
import { clusterScopeLabels, clusterStatusOptions, type ClusterStatusCode } from "@/types/clusters";

export type ClusterCategoryOption = {
  id: string;
  kind: ReportCategoryKind;
  label: string;
};

export type ClusterAssociationOption = {
  id: string;
  label: string;
  meta: string | null;
};

export type ClusterLinkedConditionItem = {
  categoryLabel: string | null;
  createdAt: string;
  description: string | null;
  frequencyLabel: string | null;
  href: string;
  id: string;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  statusLabel: string;
  title: string;
  unitName: string | null;
};

export type ClusterLinkedEconomicItem = {
  contractTypeLabel: string | null;
  createdAt: string;
  description: string | null;
  formalRole: string | null;
  href: string;
  id: string;
  issueTypeLabel: string | null;
  realFunction: string | null;
  salaryBandLabel: string | null;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  statusLabel: string;
  title: string;
  unitName: string | null;
};

export type ClusterListItem = {
  categoryKind: ReportCategoryKind | null;
  categoryLabel: string | null;
  createdAt: string;
  economicLinkCount: number;
  id: string;
  linkCount: number;
  reportLinkCount: number;
  scopeLabel: string;
  status: ClusterStatusCode;
  summary: string | null;
  title: string;
};

export type ClusterListContext = {
  categories: ClusterCategoryOption[];
  clusters: ClusterListItem[];
  companies: AdminCompanyOption[];
  selectedCompany: AdminCompanyOption | null;
  selectedCompanyId: string | null;
  userId: string | null;
};

export type ClusterDetailContext = {
  availableEconomicReports: ClusterAssociationOption[];
  availableReports: ClusterAssociationOption[];
  categoryId: string | null;
  categoryKind: ReportCategoryKind | null;
  categoryLabel: string | null;
  categoryOptions: ClusterCategoryOption[];
  companyId: string;
  companyName: string;
  companySlug: string;
  createdAt: string;
  canViewModerationTrail: boolean;
  economicLinkCount: number;
  id: string;
  linkedEconomicReports: ClusterLinkedEconomicItem[];
  linkedReports: ClusterLinkedConditionItem[];
  linkCount: number;
  moderationEvents: ModerationTrailItem[];
  scopeLabel: string;
  status: ClusterStatusCode;
  summary: string | null;
  title: string;
  updatedAt: string;
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

function labelStatus(status: ReportStatus | ClusterStatusCode) {
  const entry = clusterStatusOptions.find((option) => option.code === status);
  return entry?.label ?? status;
}

function determineScopeLabel(
  categoryKind: ReportCategoryKind | null,
  reportLinkCount: number,
  economicLinkCount: number,
) {
  if (categoryKind) {
    return clusterScopeLabels[categoryKind];
  }

  if (reportLinkCount > 0 && economicLinkCount > 0) {
    return clusterScopeLabels.mixed;
  }

  if (reportLinkCount > 0) {
    return clusterScopeLabels.conditions;
  }

  if (economicLinkCount > 0) {
    return clusterScopeLabels.economic;
  }

  return clusterScopeLabels.undefined;
}

async function getCompanyContext(companyId?: string) {
  const workspace = await getAdminWorkspaceContext(companyId);

  return workspace;
}

async function getClusterCategoryOptions(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<ClusterCategoryOption[]> {
  const { data } = await supabase
    .from("report_categories")
    .select("id, name, category_kind")
    .eq("company_id", companyId)
    .order("category_kind", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.category_kind as ReportCategoryKind,
    label: row.name,
  }));
}

async function getClusterLinkCounts(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  const [reportLinksResult, economicLinksResult] = await Promise.all([
    supabase.from("cluster_reports").select("cluster_id").eq("company_id", companyId),
    supabase.from("cluster_economic_reports").select("cluster_id").eq("company_id", companyId),
  ]);

  const reportLinkCounts = new Map<string, number>();
  const economicLinkCounts = new Map<string, number>();

  for (const row of reportLinksResult.data ?? []) {
    reportLinkCounts.set(row.cluster_id, (reportLinkCounts.get(row.cluster_id) ?? 0) + 1);
  }

  for (const row of economicLinksResult.data ?? []) {
    economicLinkCounts.set(row.cluster_id, (economicLinkCounts.get(row.cluster_id) ?? 0) + 1);
  }

  return { economicLinkCounts, reportLinkCounts };
}

async function getReferenceMaps(
  supabase: SupabaseClient<Database>,
  reportRows: Array<{
    category_id: string | null;
    sector_id: string | null;
    shift_id: string | null;
    unit_id: string | null;
    severity_code: string | null;
    frequency_code: string | null;
  }>,
  economicRows: Array<{
    category_id: string | null;
    contract_type_code: string | null;
    issue_type_code: string | null;
    salary_band_code: string | null;
    sector_id: string | null;
    shift_id: string | null;
    unit_id: string | null;
    severity_code: string | null;
  }>,
) {
  const unitIds = [
    ...new Set([
      ...reportRows.flatMap((row) => (row.unit_id ? [row.unit_id] : [])),
      ...economicRows.flatMap((row) => (row.unit_id ? [row.unit_id] : [])),
    ]),
  ];
  const sectorIds = [
    ...new Set([
      ...reportRows.flatMap((row) => (row.sector_id ? [row.sector_id] : [])),
      ...economicRows.flatMap((row) => (row.sector_id ? [row.sector_id] : [])),
    ]),
  ];
  const shiftIds = [
    ...new Set([
      ...reportRows.flatMap((row) => (row.shift_id ? [row.shift_id] : [])),
      ...economicRows.flatMap((row) => (row.shift_id ? [row.shift_id] : [])),
    ]),
  ];
  const categoryIds = [
    ...new Set([
      ...reportRows.flatMap((row) => (row.category_id ? [row.category_id] : [])),
      ...economicRows.flatMap((row) => (row.category_id ? [row.category_id] : [])),
    ]),
  ];
  const severityCodes = [
    ...new Set([
      ...reportRows.flatMap((row) => (row.severity_code ? [row.severity_code] : [])),
      ...economicRows.flatMap((row) => (row.severity_code ? [row.severity_code] : [])),
    ]),
  ];
  const frequencyCodes = [
    ...new Set(reportRows.flatMap((row) => (row.frequency_code ? [row.frequency_code] : []))),
  ];
  const contractTypeCodes = [
    ...new Set(economicRows.flatMap((row) => (row.contract_type_code ? [row.contract_type_code] : []))),
  ];
  const salaryBandCodes = [
    ...new Set(economicRows.flatMap((row) => (row.salary_band_code ? [row.salary_band_code] : []))),
  ];
  const issueTypeCodes = [
    ...new Set(economicRows.flatMap((row) => (row.issue_type_code ? [row.issue_type_code] : []))),
  ];

  const [
    unitsResult,
    sectorsResult,
    shiftsResult,
    categoriesResult,
    severitiesResult,
    frequenciesResult,
    contractTypesResult,
    salaryBandsResult,
    issueTypesResult,
  ] = await Promise.all([
    unitIds.length
      ? supabase.from("units").select("id, name").in("id", unitIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    sectorIds.length
      ? supabase.from("sectors").select("id, name").in("id", sectorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    shiftIds.length
      ? supabase.from("shifts").select("id, name").in("id", shiftIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    categoryIds.length
      ? supabase
          .from("report_categories")
          .select("id, name, category_kind")
          .in("id", categoryIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; name: string; category_kind: ReportCategoryKind }>,
        }),
    severityCodes.length
      ? supabase.from("severity_levels").select("code, label").in("code", severityCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    frequencyCodes.length
      ? supabase.from("frequency_levels").select("code, label").in("code", frequencyCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    contractTypeCodes.length
      ? supabase.from("contract_types").select("code, label").in("code", contractTypeCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    salaryBandCodes.length
      ? supabase.from("salary_bands").select("code, label").in("code", salaryBandCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    issueTypeCodes.length
      ? supabase.from("issue_types").select("code, label").in("code", issueTypeCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
  ]);

  return {
    categories: mapRowsById(categoriesResult.data),
    contractTypes: mapLookupRows(contractTypesResult.data),
    frequencies: mapLookupRows(frequenciesResult.data),
    issueTypes: mapLookupRows(issueTypesResult.data),
    salaryBands: mapLookupRows(salaryBandsResult.data),
    sectors: mapRowsById(sectorsResult.data),
    severities: mapLookupRows(severitiesResult.data),
    shifts: mapRowsById(shiftsResult.data),
    units: mapRowsById(unitsResult.data),
  };
}

export const getClusterListContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      categories: [],
      clusters: [],
      companies: [],
      selectedCompany: null,
      selectedCompanyId: null,
      userId: null,
    } satisfies ClusterListContext;
  }

  const workspace = await getCompanyContext(companyId);

  if (!workspace.selectedCompany) {
    return {
      categories: [],
      clusters: [],
      companies: workspace.companies,
      selectedCompany: null,
      selectedCompanyId: null,
      userId: auth.user.id,
    } satisfies ClusterListContext;
  }

  const supabase = await createClient();
  const [categories, clusters, counts] = await Promise.all([
    getClusterCategoryOptions(supabase, workspace.selectedCompany.id),
    supabase
      .from("issue_clusters")
      .select("id, title, summary, status, category_id, created_at")
      .eq("company_id", workspace.selectedCompany.id)
      .order("created_at", { ascending: false }),
    getClusterLinkCounts(supabase, workspace.selectedCompany.id),
  ]);

  const categoryMap = mapRowsById(categories);

  const clusterItems = (clusters.data ?? []).map((cluster) => {
    const category = cluster.category_id ? categoryMap.get(cluster.category_id) ?? null : null;
    const reportLinkCount = counts.reportLinkCounts.get(cluster.id) ?? 0;
    const economicLinkCount = counts.economicLinkCounts.get(cluster.id) ?? 0;
    const linkCount = reportLinkCount + economicLinkCount;

    return {
      categoryKind: category?.kind ?? null,
      categoryLabel: category?.label ?? null,
      createdAt: cluster.created_at,
      economicLinkCount,
      id: cluster.id,
      linkCount,
      reportLinkCount,
      scopeLabel: determineScopeLabel(category?.kind ?? null, reportLinkCount, economicLinkCount),
      status: cluster.status as ClusterStatusCode,
      summary: cluster.summary,
      title: cluster.title,
    } satisfies ClusterListItem;
  });

  return {
    categories,
    clusters: clusterItems,
    companies: workspace.companies,
    selectedCompany: workspace.selectedCompany,
    selectedCompanyId: workspace.selectedCompanyId,
    userId: auth.user.id,
  } satisfies ClusterListContext;
});

export const getClusterDetailContext = cache(async (clusterId: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured() || !isUuid(clusterId)) {
    return null;
  }

  const supabase = await createClient();

  const { data: cluster } = await supabase
    .from("issue_clusters")
    .select("id, company_id, category_id, title, summary, status, created_at, updated_at")
    .eq("id", clusterId)
    .maybeSingle();

  if (!cluster) {
    return null;
  }

  const workspace = await getCompanyContext(cluster.company_id);
  if (!workspace.selectedCompany) {
    return null;
  }

  const moderationWorkspace = await getModerationWorkspaceContext(cluster.company_id);
  const canViewModerationTrail = Boolean(moderationWorkspace.selectedCompany);

  const [categoryOptions, linkedReportsResult, linkedEconomicResults] = await Promise.all([
    getClusterCategoryOptions(supabase, cluster.company_id),
    supabase
      .from("cluster_reports")
      .select("report_id")
      .eq("cluster_id", cluster.id)
      .eq("company_id", cluster.company_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cluster_economic_reports")
      .select("economic_report_id")
      .eq("cluster_id", cluster.id)
      .eq("company_id", cluster.company_id)
      .order("created_at", { ascending: false }),
  ]);

  const reportIds = (linkedReportsResult.data ?? []).map((row) => row.report_id);
  const economicReportIds = (linkedEconomicResults.data ?? []).map((row) => row.economic_report_id);

  const [reportsResult, economicReportsResult] = await Promise.all([
    reportIds.length
      ? supabase
          .from("reports")
          .select(
            "id, title, description, status, created_at, unit_id, sector_id, shift_id, category_id, severity_code, frequency_code",
          )
          .in("id", reportIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            title: string;
            description: string | null;
            status: ReportStatus;
            created_at: string;
            unit_id: string | null;
            sector_id: string | null;
            shift_id: string | null;
            category_id: string | null;
            severity_code: string | null;
            frequency_code: string | null;
          }>,
        }),
    economicReportIds.length
      ? supabase
          .from("economic_reports")
          .select(
            "id, title, description, status, created_at, unit_id, sector_id, shift_id, category_id, severity_code, contract_type_code, salary_band_code, issue_type_code, formal_role, real_function",
          )
          .in("id", economicReportIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            title: string;
            description: string | null;
            status: ReportStatus;
            created_at: string;
            unit_id: string | null;
            sector_id: string | null;
            shift_id: string | null;
            category_id: string | null;
            severity_code: string | null;
            contract_type_code: string | null;
            salary_band_code: string | null;
            issue_type_code: string | null;
            formal_role: string | null;
            real_function: string | null;
          }>,
        }),
  ]);

  const referenceMaps = await getReferenceMaps(
    supabase,
    reportsResult.data ?? [],
    economicReportsResult.data ?? [],
  );

  const linkedReports = (reportsResult.data ?? []).map((report) => ({
    categoryLabel: report.category_id
      ? referenceMaps.categories.get(report.category_id)?.name ?? null
      : null,
    createdAt: report.created_at,
    description: report.description,
    frequencyLabel: report.frequency_code
      ? referenceMaps.frequencies.get(report.frequency_code)?.label ?? null
      : null,
    href: `/relatos/${report.id}`,
    id: report.id,
    sectorName: report.sector_id ? referenceMaps.sectors.get(report.sector_id)?.name ?? null : null,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: report.shift_id ? referenceMaps.shifts.get(report.shift_id)?.name ?? null : null,
    status: report.status,
    statusLabel: labelStatus(report.status),
    title: report.title,
    unitName: report.unit_id ? referenceMaps.units.get(report.unit_id)?.name ?? null : null,
  })) satisfies ClusterLinkedConditionItem[];

  const linkedEconomicReports = (economicReportsResult.data ?? []).map((report) => ({
    contractTypeLabel: report.contract_type_code
      ? referenceMaps.contractTypes.get(report.contract_type_code)?.label ?? null
      : null,
    createdAt: report.created_at,
    description: report.description,
    formalRole: report.formal_role,
    href: `/economico/${report.id}`,
    id: report.id,
    issueTypeLabel: report.issue_type_code
      ? referenceMaps.issueTypes.get(report.issue_type_code)?.label ?? null
      : null,
    realFunction: report.real_function,
    salaryBandLabel: report.salary_band_code
      ? referenceMaps.salaryBands.get(report.salary_band_code)?.label ?? null
      : null,
    sectorName: report.sector_id ? referenceMaps.sectors.get(report.sector_id)?.name ?? null : null,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: report.shift_id ? referenceMaps.shifts.get(report.shift_id)?.name ?? null : null,
    status: report.status,
    statusLabel: labelStatus(report.status),
    title: report.title,
    unitName: report.unit_id ? referenceMaps.units.get(report.unit_id)?.name ?? null : null,
  })) satisfies ClusterLinkedEconomicItem[];

  const category = cluster.category_id
    ? categoryOptions.find((option) => option.id === cluster.category_id) ?? null
    : null;
  const reportLinkCount = linkedReports.length;
  const economicLinkCount = linkedEconomicReports.length;
  const scopeLabel = determineScopeLabel(category?.kind ?? null, reportLinkCount, economicLinkCount);
  const moderationEvents = canViewModerationTrail
    ? await getModerationTrailForEntity({
        companyId: cluster.company_id,
        entityId: cluster.id,
        entityType: "issue_cluster",
      })
    : [];

  const availableReportsResult = await supabase
    .from("reports")
    .select("id, title, status, created_at")
    .eq("company_id", cluster.company_id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(25);

  const availableReports = (availableReportsResult.data ?? [])
    .filter((report) => !reportIds.includes(report.id))
    .map((report) => ({
      id: report.id,
      label: report.title,
      meta: labelStatus(report.status),
    }));

  const availableEconomicReportsResult = await supabase
    .from("economic_reports")
    .select("id, title, status, created_at")
    .eq("company_id", cluster.company_id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(25);

  const availableEconomicReports = (availableEconomicReportsResult.data ?? [])
    .filter((report) => !economicReportIds.includes(report.id))
    .map((report) => ({
      id: report.id,
      label: report.title,
      meta: labelStatus(report.status),
    }));

  return {
    availableEconomicReports,
    availableReports,
    categoryId: cluster.category_id,
    categoryKind: category?.kind ?? null,
    categoryLabel: category?.label ?? null,
    categoryOptions,
    companyId: cluster.company_id,
    companyName: workspace.selectedCompany.name,
    companySlug: workspace.selectedCompany.slug,
    createdAt: cluster.created_at,
    canViewModerationTrail,
    economicLinkCount,
    id: cluster.id,
    linkedEconomicReports,
    linkedReports,
    linkCount: reportLinkCount + economicLinkCount,
    moderationEvents,
    scopeLabel,
    status: cluster.status as ClusterStatusCode,
    summary: cluster.summary,
    title: cluster.title,
    updatedAt: cluster.updated_at,
  } satisfies ClusterDetailContext;
});
