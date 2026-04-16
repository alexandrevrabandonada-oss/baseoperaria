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
  ReportStatus,
} from "@/lib/supabase/types";
import { economicIssueTypeOptions } from "@/types/economico";
import { reportConfirmationOptions, type ReportConfirmationType } from "@/types/relatos";

export type EconomicCompanyOption = {
  id: string;
  name: string;
  role: CompanyRole;
  slug: string;
};

export type EconomicReferenceOption = {
  id: string;
  label: string;
};

export type EconomicLookupOption = LookupRow;

export type EconomicFormContext = {
  companies: EconomicCompanyOption[];
  contractTypeOptions: EconomicLookupOption[];
  hasSelectedCompany: boolean;
  issueTypeOptions: EconomicLookupOption[];
  salaryBandOptions: EconomicLookupOption[];
  selectedCompany: EconomicCompanyOption | null;
  selectedCompanyId: string | null;
  sectorOptions: EconomicReferenceOption[];
  severityOptions: EconomicLookupOption[];
  shiftOptions: EconomicReferenceOption[];
  unitOptions: EconomicReferenceOption[];
};

export type EconomicReportListItem = {
  companyName: string;
  contractTypeLabel: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  issueTypeLabel: string | null;
  salaryBandLabel: string | null;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

export type EconomicReportAttachmentItem = {
  byteSize: number | null;
  createdAt: string;
  fileName: string;
  id: string;
  mimeType: string | null;
  signedUrl: string | null;
  storagePath: string;
};

export type EconomicReportConfirmationSummary = {
  code: ReportConfirmationType;
  count: number;
  label: string;
};

export type EconomicSignal = {
  hint: string | null;
  label: string;
  value: string;
};

export type EconomicReportDetailContext = {
  attachments: EconomicReportAttachmentItem[];
  aggregateSignals: EconomicSignal[];
  companyId: string;
  companyName: string;
  confirmationSummaries: EconomicReportConfirmationSummary[];
  contractTypeLabel: string | null;
  createdAt: string;
  description: string | null;
  canViewModerationTrail: boolean;
  formalRole: string | null;
  id: string;
  isCreator: boolean;
  issueTypeLabel: string | null;
  moderationEvents: ModerationTrailItem[];
  myConfirmation: ReportConfirmationType | null;
  realFunction: string | null;
  salaryBandLabel: string | null;
  sectorName: string | null;
  severityLabel: string | null;
  shiftName: string | null;
  status: ReportStatus;
  title: string;
  unitName: string | null;
};

type ReferenceMaps = {
  companies: Map<string, { id: string; name: string }>;
  contractTypes: Map<string, { code: string; label: string }>;
  issueTypes: Map<string, { code: string; label: string }>;
  salaryBands: Map<string, { code: string; label: string }>;
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

function mapLookupRows<T extends { code: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.code, row] as const));
}

async function getMemberCompanies(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<EconomicCompanyOption[]> {
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
    .filter((company): company is EconomicCompanyOption => company !== null);
}

async function getReferenceMaps(
  supabase: SupabaseClient<Database>,
  reports: Array<{
    company_id: string;
    contract_type_code: string | null;
    issue_type_code: string | null;
    salary_band_code: string | null;
    sector_id: string | null;
    severity_code: string | null;
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
  const contractTypeCodes = [
    ...new Set(
      reports.flatMap((report) => (report.contract_type_code ? [report.contract_type_code] : [])),
    ),
  ];
  const salaryBandCodes = [
    ...new Set(reports.flatMap((report) => (report.salary_band_code ? [report.salary_band_code] : []))),
  ];
  const issueTypeCodes = [
    ...new Set(reports.flatMap((report) => (report.issue_type_code ? [report.issue_type_code] : []))),
  ];

  const [
    companiesResult,
    unitsResult,
    sectorsResult,
    shiftsResult,
    contractTypesResult,
    salaryBandsResult,
    issueTypesResult,
    severityResult,
  ] = await Promise.all([
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
    contractTypeCodes.length
      ? supabase.from("contract_types").select("code, label").in("code", contractTypeCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    salaryBandCodes.length
      ? supabase.from("salary_bands").select("code, label").in("code", salaryBandCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    issueTypeCodes.length
      ? supabase.from("issue_types").select("code, label").in("code", issueTypeCodes)
      : Promise.resolve({ data: [] as Array<{ code: string; label: string }> }),
    supabase
      .from("severity_levels")
      .select("code, label, active")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    companies: new Map(
      (companiesResult.data ?? []).map((row) => [row.id, { id: row.id, name: row.name }]),
    ),
    contractTypes: mapLookupRows(contractTypesResult.data),
    issueTypes: mapLookupRows(issueTypesResult.data),
    salaryBands: mapLookupRows(salaryBandsResult.data),
    sectors: new Map((sectorsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
    severities: mapLookupRows(severityResult.data),
    shifts: new Map((shiftsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
    units: new Map((unitsResult.data ?? []).map((row) => [row.id, { id: row.id, label: row.name }])),
  };
}

export const getEconomicLandingContext = cache(async () => {
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
    .from("economic_reports")
    .select("id", { count: "exact", head: true })
    .eq("created_by_profile_id", auth.user.id);

  return {
    companies,
    reportCount: count ?? 0,
    user: auth.user,
  };
});

export const getEconomicFormContext = cache(async (companyId?: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured()) {
    return {
      companies: [],
      contractTypeOptions: [],
      hasSelectedCompany: false,
      issueTypeOptions: [],
      salaryBandOptions: [],
      selectedCompany: null,
      selectedCompanyId: null,
      sectorOptions: [],
      severityOptions: [],
      shiftOptions: [],
      unitOptions: [],
    } satisfies EconomicFormContext;
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
      contractTypeOptions: [],
      hasSelectedCompany: false,
      issueTypeOptions: [],
      salaryBandOptions: [],
      selectedCompany: null,
      selectedCompanyId: null,
      sectorOptions: [],
      severityOptions: [],
      shiftOptions: [],
      unitOptions: [],
    } satisfies EconomicFormContext;
  }

  const [severityOptions, contractTypeOptions, salaryBandOptions, unitResult, sectorResult, shiftResult, issueTypeResult] =
    await Promise.all([
      supabase
        .from("severity_levels")
        .select("code, label, sort_order, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("contract_types")
        .select("code, label, sort_order, active")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("salary_bands")
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
        .from("issue_types")
        .select("code, label, sort_order, active")
        .in(
          "code",
          economicIssueTypeOptions.map((option) => option.code),
        )
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);

  return {
    companies,
    contractTypeOptions: contractTypeOptions.data ?? [],
    hasSelectedCompany: true,
    issueTypeOptions: issueTypeResult.data ?? [],
    salaryBandOptions: salaryBandOptions.data ?? [],
    selectedCompany,
    selectedCompanyId: selectedCompany.id,
    sectorOptions: (sectorResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    severityOptions: severityOptions.data ?? [],
    shiftOptions: (shiftResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    unitOptions: (unitResult.data ?? []).map((row) => ({ id: row.id, label: row.name })),
  } satisfies EconomicFormContext;
});

export const getMyEconomicReportsContext = cache(async (companyId?: string) => {
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
    .from("economic_reports")
    .select(
      "id, company_id, unit_id, sector_id, shift_id, contract_type_code, salary_band_code, issue_type_code, severity_code, title, description, status, created_at",
    )
    .eq("created_by_profile_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (selectedCompanyId) {
    query = query.eq("company_id", selectedCompanyId);
  }

  const { data: reports } = await query;
  const referenceMaps = await getReferenceMaps(supabase, reports ?? []);

  const reportItems = (reports ?? []).map((report) => ({
    companyName: referenceMaps.companies.get(report.company_id)?.name ?? "Empresa",
    contractTypeLabel: report.contract_type_code
      ? referenceMaps.contractTypes.get(report.contract_type_code)?.label ?? null
      : null,
    createdAt: report.created_at,
    description: report.description,
    id: report.id,
    issueTypeLabel: report.issue_type_code
      ? referenceMaps.issueTypes.get(report.issue_type_code)?.label ?? null
      : null,
    salaryBandLabel: report.salary_band_code
      ? referenceMaps.salaryBands.get(report.salary_band_code)?.label ?? null
      : null,
    sectorName: referenceMaps.sectors.get(report.sector_id ?? "")?.label ?? null,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
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

export const getEconomicReportDetailContext = cache(async (reportId: string) => {
  const auth = await getAuthContext();

  if (!auth.user || !isSupabaseConfigured() || !isUuid(reportId)) {
    return null;
  }

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("economic_reports")
    .select(
      "id, company_id, unit_id, sector_id, shift_id, contract_type_code, salary_band_code, issue_type_code, severity_code, title, description, status, created_at, created_by_profile_id, formal_role, real_function",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return null;
  }

  const [confirmationsResult, attachmentsResult, referenceMaps, companyCount, sameIssueCount, sameBandCount, sameContractCount] =
    await Promise.all([
      supabase
        .from("economic_report_confirmations")
        .select("profile_id, confirmation_type_code, created_at")
        .eq("economic_report_id", report.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("economic_report_attachments")
        .select("id, file_name, storage_path, mime_type, byte_size, created_at")
        .eq("economic_report_id", report.id)
        .order("created_at", { ascending: true }),
      getReferenceMaps(supabase, [report]),
      supabase
        .from("economic_reports")
        .select("id", { count: "exact", head: true })
        .eq("company_id", report.company_id),
      report.issue_type_code
        ? supabase
            .from("economic_reports")
            .select("id", { count: "exact", head: true })
            .eq("company_id", report.company_id)
            .eq("issue_type_code", report.issue_type_code)
            .neq("id", report.id)
        : Promise.resolve({ count: 0 }),
      report.salary_band_code
        ? supabase
            .from("economic_reports")
            .select("id", { count: "exact", head: true })
            .eq("company_id", report.company_id)
            .eq("salary_band_code", report.salary_band_code)
            .neq("id", report.id)
        : Promise.resolve({ count: 0 }),
      report.contract_type_code
        ? supabase
            .from("economic_reports")
            .select("id", { count: "exact", head: true })
            .eq("company_id", report.company_id)
            .eq("contract_type_code", report.contract_type_code)
            .neq("id", report.id)
      : Promise.resolve({ count: 0 }),
    ]);

  const moderationWorkspace = await getModerationWorkspaceContext(report.company_id);
  const canViewModerationTrail = Boolean(moderationWorkspace.selectedCompany);
  const moderationEvents = canViewModerationTrail
    ? await getModerationTrailForEntity({
        companyId: report.company_id,
        entityId: report.id,
        entityType: "economic_report",
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
        .from("economic-report-attachments")
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
    aggregateSignals: [
      {
        hint: "Registros econômicos neste escopo de empresa.",
        label: "Registros na empresa",
        value: String(companyCount.count ?? 0),
      },
      {
        hint: "Outros registros com o mesmo tipo de problema.",
        label: "Mesmo problema",
        value: String(sameIssueCount.count ?? 0),
      },
      {
        hint: "Outros registros com a mesma faixa salarial.",
        label: "Mesma faixa salarial",
        value: String(sameBandCount.count ?? 0),
      },
      {
        hint: "Outros registros com o mesmo vínculo.",
        label: "Mesmo vínculo",
        value: String(sameContractCount.count ?? 0),
      },
    ],
    companyId: report.company_id,
    companyName: referenceMaps.companies.get(report.company_id)?.name ?? "Empresa",
    confirmationSummaries: reportConfirmationOptions.map((option) => ({
      code: option.code,
      count: counts.get(option.code) ?? 0,
      label: option.label,
    })),
    contractTypeLabel: report.contract_type_code
      ? referenceMaps.contractTypes.get(report.contract_type_code)?.label ?? null
      : null,
    createdAt: report.created_at,
    description: report.description,
    canViewModerationTrail,
    formalRole: report.formal_role,
    id: report.id,
    issueTypeLabel: report.issue_type_code
      ? referenceMaps.issueTypes.get(report.issue_type_code)?.label ?? null
      : null,
    isCreator: report.created_by_profile_id === auth.user.id,
    moderationEvents,
    myConfirmation:
      ((confirmationsResult.data ?? []).find(
        (confirmation) => confirmation.profile_id === auth.user.id,
      )?.confirmation_type_code as ReportConfirmationType | undefined) ?? null,
    realFunction: report.real_function,
    salaryBandLabel: report.salary_band_code
      ? referenceMaps.salaryBands.get(report.salary_band_code)?.label ?? null
      : null,
    sectorName: referenceMaps.sectors.get(report.sector_id ?? "")?.label ?? null,
    severityLabel: report.severity_code
      ? referenceMaps.severities.get(report.severity_code)?.label ?? null
      : null,
    shiftName: referenceMaps.shifts.get(report.shift_id ?? "")?.label ?? null,
    status: report.status,
    title: report.title,
    unitName: referenceMaps.units.get(report.unit_id ?? "")?.label ?? null,
  } satisfies EconomicReportDetailContext;
});
