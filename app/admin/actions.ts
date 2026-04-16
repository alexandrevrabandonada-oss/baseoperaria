"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminCompaniesForProfile } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null, options: { max: number; min: number }) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < options.min || normalized.length > options.max) {
    return null;
  }

  return normalized;
}

function normalizeOptionalText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= max ? normalized : null;
}

function normalizeSlug(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.length > 0 ? normalized : null;
}

function normalizeCode(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return normalized.length > 0 ? normalized : null;
}

function normalizeTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : null;
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function normalizePath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/admin")) {
    return fallback;
  }

  return trimmed;
}

function buildCodeFallback(value: string | null, fallback: string): string {
  return value ?? fallback;
}

function isUniqueViolation(error: { code?: string | null } | null | undefined) {
  return error?.code === "23505";
}

async function getAdminContext() {
  if (!isSupabaseConfigured()) {
    return { companies: [], supabase: null, userId: null };
  }

  const auth = await getAuthContext();

  if (!auth.user) {
    return { companies: [], supabase: null, userId: null };
  }

  const supabase = await createClient();
  const companies = await getAdminCompaniesForProfile(supabase, auth.user.id);

  return {
    companies,
    supabase,
    userId: auth.user.id,
  };
}

async function assertAdminCompany(companyId: string) {
  const context = await getAdminContext();

  if (!context.supabase || !context.userId) {
    redirect("/entrar");
  }

  const company = context.companies.find((item) => item.id === companyId);

  if (!company) {
    redirect("/admin?status=sem-permissao");
  }
}

function revalidateAdmin(returnTo: string) {
  const path = new URL(returnTo, "http://localhost").pathname;
  revalidatePath("/admin");
  revalidatePath(path);
}

function redirectBack(returnTo: string, status: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}status=${status}`);
}

export async function saveCompanyAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/empresas", "erro");
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const companies = await getAdminCompaniesForProfile(supabase, auth.user.id);
  const returnTo = normalizePath(formData.get("return_to"), "/admin/empresas");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const name = normalizeText(formData.get("name"), { min: 2, max: 120 });
  const slugInput = normalizeSlug(formData.get("slug"));
  const description = normalizeOptionalText(formData.get("description"), 240);
  const website = normalizeOptionalText(formData.get("website"), 240);

  if (!name) {
    redirectBack(returnTo, "nome-invalido");
  }

  if (companies.length === 0) {
    redirectBack("/admin/empresas", "sem-permissao");
  }

  const slug = buildCodeFallback(slugInput, normalizeSlug(name) ?? "empresa");

  if (!companyId) {
    const { error } = await supabase.from("companies").insert({
      created_by_profile_id: auth.user.id,
      description,
      name,
      slug,
      website,
    });

    if (isUniqueViolation(error)) {
      redirectBack(returnTo, "slug-duplicado");
    }

    if (error) {
      redirectBack(returnTo, "erro");
    }

    revalidateAdmin(returnTo);
    redirectBack(returnTo, "salvo");
  }

  if (!companies.some((item) => item.id === companyId)) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { error } = await supabase
    .from("companies")
    .update({
      description,
      name,
      slug,
      website,
    })
    .eq("id", companyId);

  if (isUniqueViolation(error)) {
    redirectBack(returnTo, "slug-duplicado");
  }

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateAdmin(returnTo);
  redirectBack(returnTo, "salvo");
}

export async function toggleCompanyArchiveAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/empresas", "erro");
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const companies = await getAdminCompaniesForProfile(supabase, auth.user.id);
  const returnTo = normalizePath(formData.get("return_to"), "/admin/empresas");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const nextArchived = normalizeBoolean(formData.get("next_archived"));

  if (!companyId) {
    redirectBack(returnTo, "erro");
  }

  const company = companies.find((item) => item.id === companyId);
  if (!company) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { error } = await supabase
    .from("companies")
    .update({ archived_at: nextArchived ? new Date().toISOString() : null })
    .eq("id", companyId);

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateAdmin(returnTo);
  redirectBack(returnTo, nextArchived ? "arquivada" : "reativada");
}

async function saveSupportRecordAction({
  table,
  returnTo,
  supabase,
  recordId,
  companyId,
  payload,
  uniqueErrorStatus = "duplicado",
}: {
  companyId: string;
  payload: Record<string, string | number | boolean | null | undefined>;
  recordId: string | null;
  returnTo: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  table:
    | "units"
    | "sectors"
    | "shifts"
    | "report_categories";
  uniqueErrorStatus?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = supabase.from(table);
  if (recordId) {
    const { data: existing } = await query
      .select("id")
      .eq("id", recordId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!existing) {
      redirectBack(returnTo, "dados-invalidos");
    }
  }

  const result = recordId
    ? await query.update(payload).eq("id", recordId).eq("company_id", companyId)
    : await query.insert(payload);

  if (isUniqueViolation(result.error)) {
    redirectBack(returnTo, uniqueErrorStatus);
  }

  if (result.error) {
    redirectBack(returnTo, "erro");
  }

  revalidateAdmin(returnTo);
  redirectBack(returnTo, "salvo");
}

async function toggleSupportRecordActiveAction({
  table,
  companyId,
  recordId,
  returnTo,
  supabase,
  nextActive,
}: {
  companyId: string;
  nextActive: boolean;
  recordId: string;
  returnTo: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  table: "units" | "sectors" | "shifts" | "report_categories";
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = supabase.from(table);
  const existing = await query
    .select("id")
    .eq("id", recordId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!existing.data) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error } = await query
    .update({ active: nextActive })
    .eq("id", recordId)
    .eq("company_id", companyId);

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateAdmin(returnTo);
  redirectBack(returnTo, nextActive ? "reativado" : "desativado");
}

export async function saveUnitAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/unidades");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const unitId = normalizeOptionalText(formData.get("unit_id"), 36);
  const name = normalizeText(formData.get("name"), { min: 2, max: 120 });
  const codeInput = normalizeCode(formData.get("code"));
  const description = normalizeOptionalText(formData.get("description"), 240);

  if (!companyId || !name) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  const existing = unitId
    ? await supabase
        .from("units")
        .select("id, code")
        .eq("id", unitId)
        .eq("company_id", companyId)
        .maybeSingle()
    : { data: null };

  const code = buildCodeFallback(codeInput, existing.data?.code ?? normalizeCode(name) ?? "unidade");

  await saveSupportRecordAction({
    table: "units",
    returnTo,
    supabase,
    recordId: unitId ?? null,
    companyId,
    payload: {
      code,
      company_id: companyId,
      description,
      name,
      ...(unitId ? {} : { active: true, created_by_profile_id: auth.user.id }),
    },
  });
}

export async function toggleUnitActiveAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/unidades");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const unitId = normalizeOptionalText(formData.get("unit_id"), 36);
  const nextActive = normalizeBoolean(formData.get("next_active"));

  if (!companyId || !unitId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  await toggleSupportRecordActiveAction({
    companyId,
    nextActive,
    recordId: unitId,
    returnTo,
    supabase,
    table: "units",
  });
}

export async function saveSectorAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/setores");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const sectorId = normalizeOptionalText(formData.get("sector_id"), 36);
  const unitId = normalizeOptionalText(formData.get("unit_id"), 36);
  const name = normalizeText(formData.get("name"), { min: 2, max: 120 });
  const codeInput = normalizeCode(formData.get("code"));
  const description = normalizeOptionalText(formData.get("description"), 240);

  if (!companyId || !name) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  const existing = sectorId
    ? await supabase
        .from("sectors")
        .select("id, code")
        .eq("id", sectorId)
        .eq("company_id", companyId)
        .maybeSingle()
    : { data: null };

  const code = buildCodeFallback(codeInput, existing.data?.code ?? normalizeCode(name) ?? "setor");

  await saveSupportRecordAction({
    table: "sectors",
    returnTo,
    supabase,
    recordId: sectorId ?? null,
    companyId,
    payload: {
      code,
      company_id: companyId,
      description,
      name,
      unit_id: unitId,
      ...(sectorId ? {} : { active: true, created_by_profile_id: auth.user.id }),
    },
  });
}

export async function toggleSectorActiveAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/setores");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const sectorId = normalizeOptionalText(formData.get("sector_id"), 36);
  const nextActive = normalizeBoolean(formData.get("next_active"));

  if (!companyId || !sectorId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  await toggleSupportRecordActiveAction({
    companyId,
    nextActive,
    recordId: sectorId,
    returnTo,
    supabase,
    table: "sectors",
  });
}

export async function saveShiftAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/turnos");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const shiftId = normalizeOptionalText(formData.get("shift_id"), 36);
  const unitId = normalizeOptionalText(formData.get("unit_id"), 36);
  const name = normalizeText(formData.get("name"), { min: 2, max: 120 });
  const codeInput = normalizeCode(formData.get("code"));
  const startTime = normalizeTime(formData.get("start_time"));
  const endTime = normalizeTime(formData.get("end_time"));
  const overnight = normalizeBoolean(formData.get("overnight"));

  if (!companyId || !name) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  const existing = shiftId
    ? await supabase
        .from("shifts")
        .select("id, code")
        .eq("id", shiftId)
        .eq("company_id", companyId)
        .maybeSingle()
    : { data: null };
  const code = buildCodeFallback(codeInput, existing.data?.code ?? normalizeCode(name) ?? "turno");

  await saveSupportRecordAction({
    table: "shifts",
    returnTo,
    supabase,
    recordId: shiftId ?? null,
    companyId,
    payload: {
      code,
      company_id: companyId,
      end_time: endTime,
      name,
      overnight,
      start_time: startTime,
      unit_id: unitId,
      ...(shiftId ? {} : { active: true, created_by_profile_id: auth.user.id }),
    },
  });
}

export async function toggleShiftActiveAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/turnos");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const shiftId = normalizeOptionalText(formData.get("shift_id"), 36);
  const nextActive = normalizeBoolean(formData.get("next_active"));

  if (!companyId || !shiftId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  await toggleSupportRecordActiveAction({
    companyId,
    nextActive,
    recordId: shiftId,
    returnTo,
    supabase,
    table: "shifts",
  });
}

export async function saveCategoryAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/categorias");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const categoryId = normalizeOptionalText(formData.get("category_id"), 36);
  const kind = normalizeOptionalText(formData.get("category_kind"), 16);
  const name = normalizeText(formData.get("name"), { min: 2, max: 120 });
  const codeInput = normalizeCode(formData.get("code"));
  const description = normalizeOptionalText(formData.get("description"), 240);

  if (!companyId || !name || !kind || !["conditions", "economic"].includes(kind)) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  const existing = categoryId
    ? await supabase
        .from("report_categories")
        .select("id, code")
        .eq("id", categoryId)
        .eq("company_id", companyId)
        .maybeSingle()
    : { data: null };

  const code = buildCodeFallback(codeInput, existing.data?.code ?? normalizeCode(name) ?? "categoria");

  await saveSupportRecordAction({
    table: "report_categories",
    returnTo,
    supabase,
    recordId: categoryId ?? null,
    companyId,
    payload: {
      category_kind: kind,
      code,
      company_id: companyId,
      description,
      name,
      ...(categoryId ? {} : { active: true, created_by_profile_id: auth.user.id }),
    },
  });
}

export async function toggleCategoryActiveAction(formData: FormData) {
  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const returnTo = normalizePath(formData.get("return_to"), "/admin/categorias");
  const companyId = normalizeOptionalText(formData.get("company_id"), 36);
  const categoryId = normalizeOptionalText(formData.get("category_id"), 36);
  const nextActive = normalizeBoolean(formData.get("next_active"));

  if (!companyId || !categoryId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  await assertAdminCompany(companyId);
  await toggleSupportRecordActiveAction({
    companyId,
    nextActive,
    recordId: categoryId,
    returnTo,
    supabase,
    table: "report_categories",
  });
}
