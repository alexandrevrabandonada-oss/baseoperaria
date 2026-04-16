import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json, CompanyRole, Database, ReportStatus } from "@/lib/supabase/types";
import {
  labelModerationAction,
  moderationEntityLabels,
  type ModerationActionCode,
} from "@/types/moderation";

export type GovernanceCompanyOption = {
  id: string;
  name: string;
  role: CompanyRole;
  slug: string;
};

export type ModerationWorkspaceContext = {
  companies: GovernanceCompanyOption[];
  canModerate: boolean;
  selectedCompany: GovernanceCompanyOption | null;
  selectedCompanyId: string | null;
  userId: string | null;
};

export type ModerationTrailItem = {
  actionCode: string;
  actionLabel: string;
  actorProfileId: string | null;
  createdAt: string;
  details: Json;
  entityLabel: string;
  entityType: string;
  id: string;
  reason: string | null;
};

export type ModerationReportQueueItem = {
  categoryLabel: string | null;
  clusterCount: number;
  createdAt: string;
  description: string | null;
  id: string;
  linkLabel: string | null;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

export type ModerationEconomicQueueItem = {
  clusterCount: number;
  contractTypeLabel: string | null;
  createdAt: string;
  description: string | null;
  formalRole: string | null;
  id: string;
  issueTypeLabel: string | null;
  linkLabel: string | null;
  realFunction: string | null;
  salaryBandLabel: string | null;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

export type ModerationAttachmentQueueItem = {
  companyName: string;
  createdAt: string;
  fileName: string;
  href: string;
  id: string;
  kindLabel: "Relato" | "Registro econômico";
  mimeType: string | null;
  parentTitle: string;
  signedUrl: string | null;
};

export type ModerationDashboardContext = ModerationWorkspaceContext & {
  attachments: ModerationAttachmentQueueItem[];
  economicReports: ModerationEconomicQueueItem[];
  recentEvents: ModerationTrailItem[];
  reportClusters: Array<{ id: string; label: string; meta: string | null }>;
  reports: ModerationReportQueueItem[];
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

function labelAction(actionCode: string) {
  return labelModerationAction(actionCode as ModerationActionCode);
}

function labelEntity(entityType: string) {
  return (
    moderationEntityLabels[entityType as keyof typeof moderationEntityLabels] ?? entityType
  );
}

async function getGovernanceCompaniesForProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
) {
  const { data: memberships } = await supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("profile_id", profileId)
    .in("role", ["owner", "admin", "moderator"])
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
      } satisfies GovernanceCompanyOption;
    })
    .filter((company): company is GovernanceCompanyOption => company !== null);
}

function pickSelectedCompany(
  companies: GovernanceCompanyOption[],
  companyId: string | null,
) {
  const selectedCompanyId = companies.some((company) => company.id === companyId)
    ? companyId
    : companies.length === 1
      ? companies[0]?.id ?? null
      : null;

  return {
    selectedCompany: companies.find((company) => company.id === selectedCompanyId) ?? null,
    selectedCompanyId,
  };
}

async function getReferenceMaps(
  supabase: SupabaseClient<Database>,
  companyId: string,
  reportRows: Array<{
    category_id: string | null;
    frequency_code: string | null;
    sector_id: string | null;
    severity_code: string | null;
    shift_id: string | null;
    unit_id: string | null;
  }>,
  economicRows: Array<{
    contract_type_code: string | null;
    issue_type_code: string | null;
    salary_band_code: string | null;
    sector_id: string | null;
    severity_code: string | null;
    shift_id: string | null;
    unit_id: string | null;
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
    ...new Set(reportRows.flatMap((row) => (row.category_id ? [row.category_id] : []))),
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
      ? supabase.from("units").select("id, name").eq("company_id", companyId).in("id", unitIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    sectorIds.length
      ? supabase.from("sectors").select("id, name").eq("company_id", companyId).in("id", sectorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    shiftIds.length
      ? supabase.from("shifts").select("id, name").eq("company_id", companyId).in("id", shiftIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    categoryIds.length
      ? supabase
          .from("report_categories")
          .select("id, name, category_kind")
          .eq("company_id", companyId)
          .in("id", categoryIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; name: string; category_kind: "conditions" | "economic" }>,
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
    contractTypes: mapRowsByCode(contractTypesResult.data),
    frequencies: mapRowsByCode(frequenciesResult.data),
    issueTypes: mapRowsByCode(issueTypesResult.data),
    salaryBands: mapRowsByCode(salaryBandsResult.data),
    sectors: mapRowsById(sectorsResult.data),
    severities: mapRowsByCode(severitiesResult.data),
    shifts: mapRowsById(shiftsResult.data),
    units: mapRowsById(unitsResult.data),
  };
}

async function getClusterCounts(supabase: SupabaseClient<Database>, companyId: string) {
  const [reportLinksResult, economicLinksResult] = await Promise.all([
    supabase.from("cluster_reports").select("report_id").eq("company_id", companyId),
    supabase.from("cluster_economic_reports").select("economic_report_id").eq("company_id", companyId),
  ]);

  const reportCounts = new Map<string, number>();
  const economicCounts = new Map<string, number>();

  for (const row of reportLinksResult.data ?? []) {
    reportCounts.set(row.report_id, (reportCounts.get(row.report_id) ?? 0) + 1);
  }

  for (const row of economicLinksResult.data ?? []) {
    economicCounts.set(row.economic_report_id, (economicCounts.get(row.economic_report_id) ?? 0) + 1);
  }

  return { economicCounts, reportCounts };
}

async function getRecentAttachments(
  supabase: SupabaseClient<Database>,
  companyId: string,
  companyName: string,
): Promise<ModerationAttachmentQueueItem[]> {
  const [reportAttachmentsResult, economicAttachmentsResult] = await Promise.all([
    supabase
      .from("report_attachments")
      .select("id, report_id, file_name, mime_type, storage_path, created_at, company_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("economic_report_attachments")
      .select(
        "id, economic_report_id, file_name, mime_type, storage_path, created_at, company_id",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const reportIds = [...new Set((reportAttachmentsResult.data ?? []).map((row) => row.report_id))];
  const economicIds = [
    ...new Set((economicAttachmentsResult.data ?? []).map((row) => row.economic_report_id)),
  ];

  const [reportsResult, economicReportsResult] = await Promise.all([
    reportIds.length
      ? supabase.from("reports").select("id, title").eq("company_id", companyId).in("id", reportIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    economicIds.length
      ? supabase
          .from("economic_reports")
          .select("id, title")
          .eq("company_id", companyId)
          .in("id", economicIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);

  const reportMap = mapRowsById(reportsResult.data);
  const economicMap = mapRowsById(economicReportsResult.data);

  const reportItems = await Promise.all(
    (reportAttachmentsResult.data ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("report-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 60);

      return {
        companyName,
        createdAt: attachment.created_at,
        fileName: attachment.file_name,
        href: `/relatos/${attachment.report_id}`,
        id: attachment.id,
        kindLabel: "Relato" as const,
        mimeType: attachment.mime_type,
        parentTitle: reportMap.get(attachment.report_id)?.title ?? "Relato",
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  const economicItems = await Promise.all(
    (economicAttachmentsResult.data ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("economic-report-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 60);

      return {
        companyName,
        createdAt: attachment.created_at,
        fileName: attachment.file_name,
        href: `/economico/${attachment.economic_report_id}`,
        id: attachment.id,
        kindLabel: "Registro econômico" as const,
        mimeType: attachment.mime_type,
        parentTitle: economicMap.get(attachment.economic_report_id)?.title ?? "Registro",
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  return [...reportItems, ...economicItems].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

async function getRecentModerationEvents(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<ModerationTrailItem[]> {
  const { data } = await supabase
    .from("moderation_events")
    .select("id, action_type, actor_profile_id, entity_type, entity_id, reason, details, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((event) => ({
    actionCode: event.action_type,
    actionLabel: labelAction(event.action_type),
    actorProfileId: event.actor_profile_id,
    createdAt: event.created_at,
    details: event.details,
    entityLabel: labelEntity(event.entity_type),
    entityType: event.entity_type,
    id: event.id,
    reason: event.reason,
  }));
}

export async function recordModerationEvent(
  supabase: SupabaseClient<Database>,
  input: {
    actionCode: ModerationActionCode | string;
    actorProfileId: string;
    companyId: string;
    details?: Json;
    entityId: string;
    entityType: string;
    reason?: string | null;
  },
) {
  return supabase.from("moderation_events").insert({
    action_type: input.actionCode,
    actor_profile_id: input.actorProfileId,
    company_id: input.companyId,
    details: input.details ?? {},
    entity_id: input.entityId,
    entity_type: input.entityType,
    reason: input.reason ?? null,
  });
}

export const getModerationAccessContext = cache(async () => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      canModerate: false,
      selectedCompany: null,
      selectedCompanyId: null,
      user: auth.user,
      userId: null,
    };
  }

  const supabase = await createClient();
  const companies = await getGovernanceCompaniesForProfile(supabase, auth.user.id);

  return {
    companies,
    canModerate: companies.length > 0,
    selectedCompany: null,
    selectedCompanyId: null,
    user: auth.user,
    userId: auth.user.id,
  };
});

export const getModerationWorkspaceContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      canModerate: false,
      selectedCompany: null,
      selectedCompanyId: null,
      userId: null,
    } satisfies ModerationWorkspaceContext;
  }

  const supabase = await createClient();
  const companies = await getGovernanceCompaniesForProfile(supabase, auth.user.id);
  const candidateCompanyId = isUuid(companyId) ? companyId : null;
  const { selectedCompany, selectedCompanyId } = pickSelectedCompany(companies, candidateCompanyId);

  return {
    companies,
    canModerate: companies.length > 0,
    selectedCompany,
    selectedCompanyId,
    userId: auth.user.id,
  } satisfies ModerationWorkspaceContext;
});

export const getModerationDashboardContext = cache(async (companyId?: string) => {
  const workspace = await getModerationWorkspaceContext(companyId);

  if (!workspace.selectedCompany || !workspace.userId || !isSupabaseConfigured()) {
    return {
      ...workspace,
      attachments: [],
      economicReports: [],
      recentEvents: [],
      reportClusters: [],
      reports: [],
    } satisfies ModerationDashboardContext;
  }

  const supabase = await createClient();
  const selectedCompany = workspace.selectedCompany;

  const [clustersResult, reportsResult, economicReportsResult, counts, attachments, recentEvents] =
    await Promise.all([
      supabase
        .from("issue_clusters")
        .select("id, title, status")
        .eq("company_id", selectedCompany.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reports")
        .select(
          "id, title, description, status, created_at, unit_id, sector_id, shift_id, category_id, severity_code, frequency_code",
        )
        .eq("company_id", selectedCompany.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("economic_reports")
        .select(
          "id, title, description, status, created_at, unit_id, sector_id, shift_id, contract_type_code, salary_band_code, issue_type_code, severity_code, formal_role, real_function",
        )
        .eq("company_id", selectedCompany.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(20),
      getClusterCounts(supabase, selectedCompany.id),
      getRecentAttachments(supabase, selectedCompany.id, selectedCompany.name),
      getRecentModerationEvents(supabase, selectedCompany.id),
    ]);

  const [reportReferenceMaps, economicReferenceMaps] = await Promise.all([
    getReferenceMaps(supabase, selectedCompany.id, reportsResult.data ?? [], []),
    getReferenceMaps(supabase, selectedCompany.id, [], economicReportsResult.data ?? []),
  ]);

  const reportItems = (reportsResult.data ?? []).map((report) => ({
    categoryLabel: report.category_id
      ? reportReferenceMaps.categories.get(report.category_id)?.name ?? null
      : null,
    clusterCount: counts.reportCounts.get(report.id) ?? 0,
    createdAt: report.created_at,
    description: report.description,
    id: report.id,
    linkLabel: report.status,
    sectorName: report.sector_id ? reportReferenceMaps.sectors.get(report.sector_id)?.name ?? null : null,
    severityLabel: report.severity_code
      ? reportReferenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: report.shift_id ? reportReferenceMaps.shifts.get(report.shift_id)?.name ?? null : null,
    status: report.status,
    title: report.title,
    unitName: report.unit_id ? reportReferenceMaps.units.get(report.unit_id)?.name ?? null : null,
  })) satisfies ModerationReportQueueItem[];

  const economicItems = (economicReportsResult.data ?? []).map((report) => ({
    clusterCount: counts.economicCounts.get(report.id) ?? 0,
    contractTypeLabel: report.contract_type_code
      ? economicReferenceMaps.contractTypes.get(report.contract_type_code)?.label ?? null
      : null,
    createdAt: report.created_at,
    description: report.description,
    formalRole: report.formal_role,
    id: report.id,
    issueTypeLabel: report.issue_type_code
      ? economicReferenceMaps.issueTypes.get(report.issue_type_code)?.label ?? null
      : null,
    linkLabel: report.status,
    realFunction: report.real_function,
    salaryBandLabel: report.salary_band_code
      ? economicReferenceMaps.salaryBands.get(report.salary_band_code)?.label ?? null
      : null,
    sectorName: report.sector_id ? economicReferenceMaps.sectors.get(report.sector_id)?.name ?? null : null,
    severityLabel: report.severity_code
      ? economicReferenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: report.shift_id ? economicReferenceMaps.shifts.get(report.shift_id)?.name ?? null : null,
    status: report.status,
    title: report.title,
    unitName: report.unit_id ? economicReferenceMaps.units.get(report.unit_id)?.name ?? null : null,
  })) satisfies ModerationEconomicQueueItem[];

  const reportClusters = (clustersResult.data ?? []).map((cluster) => ({
    id: cluster.id,
    label: cluster.title,
    meta: cluster.status,
  }));

  return {
    ...workspace,
    attachments,
    economicReports: economicItems,
    recentEvents,
    reportClusters,
    reports: reportItems,
  } satisfies ModerationDashboardContext;
});

export const getModerationTrailForEntity = cache(async (input: {
  companyId: string;
  entityId: string;
  entityType: string;
}) => {
  if (!isSupabaseConfigured() || !isUuid(input.companyId) || !isUuid(input.entityId)) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("moderation_events")
    .select("id, action_type, actor_profile_id, entity_type, entity_id, reason, details, created_at")
    .eq("company_id", input.companyId)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((event) => ({
    actionCode: event.action_type,
    actionLabel: labelAction(event.action_type),
    actorProfileId: event.actor_profile_id,
    createdAt: event.created_at,
    details: event.details,
    entityLabel: labelEntity(event.entity_type),
    entityType: event.entity_type,
    id: event.id,
    reason: event.reason,
  }));
});
