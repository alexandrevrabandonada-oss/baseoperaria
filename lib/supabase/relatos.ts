import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getModerationTrailForEntity,
  getModerationWorkspaceContext,
  type ModerationTrailItem,
} from "@/lib/supabase/moderation";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  CompanyRole,
  Database,
  LookupRow,
  ReportCategoryKind,
  ReportStatus,
} from "@/lib/supabase/types";
import { reportConfirmationOptions, type ReportConfirmationType } from "@/types/relatos";

export type ReportCompanyOption = {
  id: string;
  name: string;
  role: CompanyRole;
  slug: string;
};

export type RelatosReferenceOption = {
  id: string;
  label: string;
};

export type RelatosLookupOption = LookupRow;

export type RelatosFormContext = {
  companies: ReportCompanyOption[];
  frequencyOptions: RelatosLookupOption[];
  hasSelectedCompany: boolean;
  selectedCompany: ReportCompanyOption | null;
  selectedCompanyId: string | null;
  sectorOptions: RelatosReferenceOption[];
  severityOptions: RelatosLookupOption[];
  shiftOptions: RelatosReferenceOption[];
  unitOptions: RelatosReferenceOption[];
  categoryOptions: Array<RelatosReferenceOption & { kind: ReportCategoryKind }>;
};

export type ReportListItem = {
  categoryLabel: string | null;
  companyName: string;
  createdAt: string;
  description: string | null;
  id: string;
  sectorName: string | null;
  severityCode: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  frequencyLabel: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

export type ReportAttachmentItem = {
  byteSize: number | null;
  createdAt: string;
  fileName: string;
  id: string;
  mimeType: string | null;
  signedUrl: string | null;
  storagePath: string;
};

export type ReportConfirmationSummary = {
  code: ReportConfirmationType;
  count: number;
  label: string;
};

export type ReportDetailContext = {
  attachments: ReportAttachmentItem[];
  categoryLabel: string | null;
  companyId: string;
  companyName: string;
  confirmationSummaries: ReportConfirmationSummary[];
  createdAt: string;
  description: string | null;
  canViewModerationTrail: boolean;
  frequencyLabel: string | null;
  id: string;
  isCreator: boolean;
  myConfirmation: ReportConfirmationType | null;
  moderationEvents: ModerationTrailItem[];
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

type ReferenceMaps = {
  categories: Map<string, { id: string; kind: ReportCategoryKind; label: string }>;
  companies: Map<string, { id: string; name: string }>;
  frequencies: Map<string, { code: string; label: string }>;
  sectors: Map<string, { id: string; label: string }>;
  severities: Map<string, { code: string; label: string }>;
  shifts: Map<string, { id: string; label: string }>;
  units: Map<string, { id: string; label: string }>;
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

async function getMemberCompanies(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<ReportCompanyOption[]> {
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
    .filter((company): company is ReportCompanyOption => company !== null);
}

async function getReferenceMaps(
  supabase: SupabaseClient<Database>,
  reports: Array<{
    category_id: string | null;
    company_id: string;
    sector_id: string | null;
    shift_id: string | null;
    unit_id: string | null;
  }>,
): Promise<ReferenceMaps> {
  const companyIds = [...new Set(reports.map((report) => report.company_id))];
  const unitIds = [...new Set(reports.flatMap((report) => (report.unit_id ? [report.unit_id] : [])))];
  const sectorIds = [
    ...new Set(reports.flatMap((report) => (report.sector_id ? [report.sector_id] : []))),
  ];
  const shiftIds = [
    ...new Set(reports.flatMap((report) => (report.shift_id ? [report.shift_id] : []))),
  ];
  const categoryIds = [
    ...new Set(reports.flatMap((report) => (report.category_id ? [report.category_id] : []))),
  ];

  const [companiesResult, unitsResult, sectorsResult, shiftsResult, categoriesResult, severityResult, frequencyResult] =
    await Promise.all([
      companyIds.length
        ? supabase.from("companies").select("id, name").in("id", companyIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
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
      supabase
        .from("severity_levels")
        .select("code, label, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("frequency_levels")
        .select("code, label, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);

  return {
    categories: new Map(
      (categoriesResult.data ?? []).map((row) => [
        row.id,
        { id: row.id, kind: row.category_kind, label: row.name },
      ]),
    ),
    companies: new Map(
      (companiesResult.data ?? []).map((row) => [row.id, { id: row.id, name: row.name }]),
    ),
    frequencies: new Map(
      (frequencyResult.data ?? []).map((row) => [row.code, { code: row.code, label: row.label }]),
    ),
    sectors: new Map((sectorsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
    severities: new Map(
      (severityResult.data ?? []).map((row) => [row.code, { code: row.code, label: row.label }]),
    ),
    shifts: new Map((shiftsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
    units: new Map((unitsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
  };
}

export const getRelatosLandingContext = cache(async () => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      reportCount: 0,
      user: auth.user,
    };
  }

  const supabase = await createClient();
  const companies = await getMemberCompanies(supabase, auth.user.id);
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("created_by_profile_id", auth.user.id);

  return {
    companies,
    reportCount: count ?? 0,
    user: auth.user,
  };
});

export const getRelatosFormContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      frequencyOptions: [],
      hasSelectedCompany: false,
      selectedCompany: null,
      selectedCompanyId: null,
      sectorOptions: [],
      severityOptions: [],
      shiftOptions: [],
      unitOptions: [],
      categoryOptions: [],
    } satisfies RelatosFormContext;
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
      frequencyOptions: [],
      hasSelectedCompany: false,
      selectedCompany: null,
      selectedCompanyId: null,
      sectorOptions: [],
      severityOptions: [],
      shiftOptions: [],
      unitOptions: [],
      categoryOptions: [],
    } satisfies RelatosFormContext;
  }

  const [severityOptions, frequencyOptions, unitResult, sectorResult, shiftResult, categoryResult] =
    await Promise.all([
      supabase
        .from("severity_levels")
        .select("code, label, sort_order, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("frequency_levels")
        .select("code, label, sort_order, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
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
        .from("report_categories")
        .select("id, name, category_kind")
        .eq("company_id", selectedCompany.id)
        .eq("category_kind", "conditions")
        .eq("active", true)
        .order("name", { ascending: true }),
    ]);

  return {
    companies,
    frequencyOptions: frequencyOptions.data ?? [],
    hasSelectedCompany: true,
    selectedCompany,
    selectedCompanyId: selectedCompany.id,
    sectorOptions: (sectorResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    severityOptions: severityOptions.data ?? [],
    shiftOptions: (shiftResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    unitOptions: (unitResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    categoryOptions: (categoryResult.data ?? []).map((row) => ({
      id: row.id,
      kind: row.category_kind,
      label: row.name,
    })),
  } satisfies RelatosFormContext;
});

export const getMyReportsContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      reportCount: 0,
      reports: [],
      selectedCompanyId: null,
      user: auth.user,
    };
  }

  const supabase = await createClient();
  const companies = await getMemberCompanies(supabase, auth.user.id);
  const candidateCompanyId = isUuid(companyId) ? companyId : null;
  const selectedCompanyId = companies.some((company) => company.id === candidateCompanyId)
    ? candidateCompanyId
    : companies.length === 1
      ? companies[0]?.id ?? null
      : null;

  let query = supabase
    .from("reports")
    .select(
      "id, company_id, unit_id, sector_id, shift_id, category_id, severity_code, frequency_code, title, description, status, created_at",
    )
    .eq("created_by_profile_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (selectedCompanyId) {
    query = query.eq("company_id", selectedCompanyId);
  }

  const { data: reports } = await query;
  const referenceMaps = await getReferenceMaps(supabase, reports ?? []);

  const reportItems = (reports ?? []).map((report) => ({
    categoryLabel: referenceMaps.categories.get(report.category_id ?? "")?.label ?? null,
    companyName: referenceMaps.companies.get(report.company_id)?.name ?? "Empresa",
    createdAt: report.created_at,
    description: report.description,
    id: report.id,
    sectorName: referenceMaps.sectors.get(report.sector_id ?? "")?.label ?? null,
    severityCode: report.severity_code,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    frequencyLabel: report.frequency_code
      ? referenceMaps.frequencies.get(report.frequency_code)?.label ?? null
      : null,
    shiftName: referenceMaps.shifts.get(report.shift_id ?? "")?.label ?? null,
    status: report.status,
    title: report.title,
    unitName: referenceMaps.units.get(report.unit_id ?? "")?.label ?? null,
  }));

  return {
    companies,
    reportCount: reportItems.length,
    reports: reportItems,
    selectedCompanyId,
    user: auth.user,
  };
});

export const getReportDetailContext = cache(async (reportId: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured() || !isUuid(reportId)) {
    return null;
  }

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select(
      "id, company_id, unit_id, sector_id, shift_id, category_id, severity_code, frequency_code, title, description, status, created_at, created_by_profile_id",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return null;
  }

  const [confirmationsResult, attachmentsResult, referenceMaps] = await Promise.all([
    supabase
      .from("report_confirmations")
      .select("profile_id, confirmation_type_code, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_attachments")
      .select("id, file_name, storage_path, mime_type, byte_size, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true }),
    getReferenceMaps(supabase, [report]),
  ]);

  const moderationWorkspace = await getModerationWorkspaceContext(report.company_id);
  const canViewModerationTrail = Boolean(moderationWorkspace.selectedCompany);
  const moderationEvents = canViewModerationTrail
    ? await getModerationTrailForEntity({
        companyId: report.company_id,
        entityId: report.id,
        entityType: "report",
      })
    : [];

  const counts = new Map<ReportConfirmationType, number>(
    reportConfirmationOptions.map((option) => [option.code, 0]),
  );

  for (const confirmation of confirmationsResult.data ?? []) {
    const code = confirmation.confirmation_type_code as ReportConfirmationType;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const attachments = await Promise.all(
    (attachmentsResult.data ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("report-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 60);

      return {
        byteSize: attachment.byte_size,
        createdAt: attachment.created_at,
        fileName: attachment.file_name,
        id: attachment.id,
        mimeType: attachment.mime_type,
        signedUrl: data?.signedUrl ?? null,
        storagePath: attachment.storage_path,
      };
    }),
  );

  return {
    attachments,
    categoryLabel: referenceMaps.categories.get(report.category_id ?? "")?.label ?? null,
    companyId: report.company_id,
    companyName: referenceMaps.companies.get(report.company_id)?.name ?? "Empresa",
    confirmationSummaries: reportConfirmationOptions.map((option) => ({
      code: option.code,
      count: counts.get(option.code) ?? 0,
      label: option.label,
    })),
    createdAt: report.created_at,
    description: report.description,
    canViewModerationTrail,
    frequencyLabel: report.frequency_code
      ? referenceMaps.frequencies.get(report.frequency_code)?.label ?? null
      : null,
    id: report.id,
    isCreator: report.created_by_profile_id === auth.user.id,
    myConfirmation:
      ((confirmationsResult.data ?? []).find(
        (confirmation) => confirmation.profile_id === auth.user.id,
      )?.confirmation_type_code as ReportConfirmationType | undefined) ?? null,
    moderationEvents,
    sectorName: referenceMaps.sectors.get(report.sector_id ?? "")?.label ?? null,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: referenceMaps.shifts.get(report.shift_id ?? "")?.label ?? null,
    status: report.status,
    title: report.title,
    unitName: referenceMaps.units.get(report.unit_id ?? "")?.label ?? null,
  } satisfies ReportDetailContext;
});
