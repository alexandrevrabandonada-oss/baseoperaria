import { economicIssueTypeOptions, type EconomicIssueTypeCode } from "@/types/economico";
import { reportConfirmationOptions, type ReportConfirmationType } from "@/types/relatos";
import { pautaKindOptions, pautaStatusOptions, type PautaKind, type PautaStatus } from "@/types/pautas";

export type ParseResult<T> = { error: string } | { value: T };

export type OnboardingInput = {
  initialLink: string;
  pseudonym: string;
};

export type ReportCreateInput = {
  categoryId: string;
  companyId: string;
  description: string | null;
  frequencyCode: string;
  sectorId: string | null;
  severityCode: string;
  shiftId: string | null;
  title: string;
  unitId: string | null;
};

export type EconomicReportCreateInput = {
  companyId: string;
  contractTypeCode: string;
  description: string;
  formalRole: string;
  issueTypeCode: EconomicIssueTypeCode;
  realFunction: string;
  salaryBandCode: string;
  sectorId: string | null;
  severityCode: string;
  shiftId: string | null;
  title: string;
  unitId: string | null;
};

export type ReportConfirmationInput = {
  confirmationTypeCode: ReportConfirmationType;
  reportId: string;
};

export type PautaCreateInput = {
  clusterId: string;
  companyId: string;
  description: string;
  kind: PautaKind;
  priorityCode: string;
  sectorId: string | null;
  status: PautaStatus;
  title: string;
  unitId: string | null;
};

export function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

export function normalizeText(
  value: FormDataEntryValue | null,
  options: { max: number; min: number },
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < options.min || normalized.length > options.max) {
    return null;
  }

  return normalized;
}

export function normalizeOptionalText(
  value: FormDataEntryValue | null,
  options: { max: number; min: number },
): string | null {
  if (typeof value === "string" && value.trim().length === 0) {
    return null;
  }

  return normalizeText(value, options);
}

export function normalizeUuid(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : null;
}

export function normalizeCode<T extends string>(
  value: FormDataEntryValue | null,
  allowed: ReadonlyArray<T>,
): T | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return allowed.includes(trimmed as T) ? (trimmed as T) : null;
}

export function normalizePath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.startsWith("/pautas") || trimmed.startsWith("/admin/clusters")
    ? trimmed
    : fallback;
}

function parseRequiredText(
  value: FormDataEntryValue | null,
  options: { max: number; min: number },
): string | null {
  return normalizeText(value, options);
}

export function parseOnboardingInput(input: {
  initialLink: FormDataEntryValue | null;
  pseudonym: FormDataEntryValue | null;
}): ParseResult<OnboardingInput> {
  const pseudonym = parseRequiredText(input.pseudonym, { min: 2, max: 40 });
  const initialLink = parseRequiredText(input.initialLink, { min: 2, max: 60 });

  if (!pseudonym || !initialLink) {
    return { error: "Preencha pseudônimo e vínculo inicial." };
  }

  return { value: { initialLink, pseudonym } };
}

export function parseReportCreateInput(input: {
  categoryId: FormDataEntryValue | null;
  companyId: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  frequencyCode: FormDataEntryValue | null;
  sectorId: FormDataEntryValue | null;
  severityCode: FormDataEntryValue | null;
  shiftId: FormDataEntryValue | null;
  title: FormDataEntryValue | null;
  unitId: FormDataEntryValue | null;
}): ParseResult<ReportCreateInput> {
  const companyId = normalizeUuid(input.companyId);
  const unitId = normalizeUuid(input.unitId);
  const sectorId = normalizeUuid(input.sectorId);
  const shiftId = normalizeUuid(input.shiftId);
  const categoryId = normalizeUuid(input.categoryId);
  const severityCode = normalizeCode(input.severityCode, [
    "low",
    "medium",
    "high",
    "critical",
  ]);
  const frequencyCode = normalizeCode(input.frequencyCode, [
    "isolated",
    "recurring",
    "frequent",
    "constant",
  ]);
  const title = parseRequiredText(input.title, { min: 2, max: 90 });
  const description = normalizeOptionalText(input.description, { min: 1, max: 240 });

  if (!companyId || !categoryId || !severityCode || !frequencyCode || !title) {
    return { error: "Preencha empresa, gravidade, frequência, categoria e título." };
  }

  return {
    value: {
      categoryId,
      companyId,
      description,
      frequencyCode,
      sectorId,
      severityCode,
      shiftId,
      title,
      unitId,
    },
  };
}

export function parseEconomicReportCreateInput(input: {
  companyId: FormDataEntryValue | null;
  contractTypeCode: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  formalRole: FormDataEntryValue | null;
  issueTypeCode: FormDataEntryValue | null;
  realFunction: FormDataEntryValue | null;
  salaryBandCode: FormDataEntryValue | null;
  sectorId: FormDataEntryValue | null;
  severityCode: FormDataEntryValue | null;
  shiftId: FormDataEntryValue | null;
  unitId: FormDataEntryValue | null;
}): ParseResult<EconomicReportCreateInput> {
  const companyId = normalizeUuid(input.companyId);
  const unitId = normalizeUuid(input.unitId);
  const sectorId = normalizeUuid(input.sectorId);
  const shiftId = normalizeUuid(input.shiftId);
  const contractTypeCode = normalizeCode(input.contractTypeCode, [
    "permanent",
    "temporary",
    "outsourced",
    "contractor",
    "apprentice",
    "intern",
    "other",
  ]);
  const salaryBandCode = normalizeCode(input.salaryBandCode, [
    "entry",
    "lower",
    "mid",
    "upper",
    "supervisory",
    "confidential",
    "other",
  ]);
  const issueTypeCode = normalizeCode(
    input.issueTypeCode,
    economicIssueTypeOptions.map((option) => option.code),
  ) as EconomicIssueTypeCode | null;
  const severityCode = normalizeCode(input.severityCode, [
    "low",
    "medium",
    "high",
    "critical",
  ]);
  const formalRole = parseRequiredText(input.formalRole, { min: 2, max: 90 });
  const realFunction = parseRequiredText(input.realFunction, { min: 2, max: 90 });
  const description = parseRequiredText(input.description, { min: 2, max: 260 });

  if (
    !companyId ||
    !contractTypeCode ||
    !salaryBandCode ||
    !issueTypeCode ||
    !severityCode ||
    !formalRole ||
    !realFunction ||
    !description
  ) {
    return {
      error: "Preencha empresa, vínculo, cargo, função, faixa, tipo, gravidade e descrição.",
    };
  }

  return {
    value: {
      companyId,
      contractTypeCode,
      description,
      formalRole,
      issueTypeCode,
      realFunction,
      salaryBandCode,
      sectorId,
      severityCode,
      shiftId,
      title: buildEconomicTitle(issueTypeCode, formalRole),
      unitId,
    },
  };
}

export function parseReportConfirmationInput(input: {
  confirmationTypeCode: FormDataEntryValue | null;
  reportId: FormDataEntryValue | null;
}): ParseResult<ReportConfirmationInput> {
  const reportId = normalizeUuid(input.reportId);
  const confirmationTypeCode = normalizeCode(
    input.confirmationTypeCode,
    reportConfirmationOptions.map((option) => option.code),
  ) as ReportConfirmationType | null;

  if (!reportId || !confirmationTypeCode) {
    return { error: "Selecione um tipo de confirmação." };
  }

  return { value: { confirmationTypeCode, reportId } };
}

export function parsePautaCreateInput(input: {
  clusterId: FormDataEntryValue | null;
  companyId: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  kind: FormDataEntryValue | null;
  priorityCode: FormDataEntryValue | null;
  sectorId: FormDataEntryValue | null;
  status: FormDataEntryValue | null;
  title: FormDataEntryValue | null;
  unitId: FormDataEntryValue | null;
}): ParseResult<PautaCreateInput> {
  const clusterId = normalizeUuid(input.clusterId);
  const companyId = normalizeUuid(input.companyId);
  const title = parseRequiredText(input.title, { min: 2, max: 120 });
  const description = parseRequiredText(input.description, { min: 1, max: 240 });
  const kind = normalizeCode(input.kind, pautaKindOptions.map((option) => option.code));
  const priorityCode = normalizeCode(input.priorityCode, [
    "low",
    "medium",
    "high",
    "critical",
  ]);
  const status = normalizeCode(input.status, pautaStatusOptions.map((option) => option.code));
  const unitId = normalizeUuid(input.unitId);
  const sectorId = normalizeUuid(input.sectorId);

  if (!clusterId || !companyId || !title || !description || !kind || !priorityCode || !status) {
    return { error: "Preencha cluster, título, texto, tipo, prioridade e status." };
  }

  return {
    value: {
      clusterId,
      companyId,
      description,
      kind,
      priorityCode,
      sectorId,
      status,
      title,
      unitId,
    },
  };
}

function buildEconomicTitle(issueTypeCode: EconomicIssueTypeCode, formalRole: string) {
  const issueTypeLabel =
    economicIssueTypeOptions.find((option) => option.code === issueTypeCode)?.label ?? issueTypeCode;
  const joined = `${issueTypeLabel} · ${formalRole}`.trim();

  if (joined.length <= 120) {
    return joined;
  }

  return joined.slice(0, 120).trim().replace(/[·\s-]+$/g, "");
}
