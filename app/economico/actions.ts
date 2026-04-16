"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import {
  parseEconomicReportCreateInput,
  parseReportConfirmationInput,
} from "@/lib/validation/workflows";
import type {
  EconomicReportConfirmationActionState,
  EconomicReportFormActionState,
} from "@/types/economico";

const economicAttachmentsBucket = "economic-report-attachments";
const maxAttachmentSizeBytes = 10 * 1024 * 1024;

function normalizeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function ensureCompanyMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  profileId: string,
) {
  const { data } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("company_id", companyId)
    .eq("profile_id", profileId)
    .maybeSingle();

  return Boolean(data);
}

export async function createEconomicReportAction(
  _: EconomicReportFormActionState,
  formData: FormData,
): Promise<EconomicReportFormActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const parsed = parseEconomicReportCreateInput({
    companyId: formData.get("company_id"),
    contractTypeCode: formData.get("contract_type_code"),
    description: formData.get("description"),
    formalRole: formData.get("formal_role"),
    issueTypeCode: formData.get("issue_type_code"),
    realFunction: formData.get("real_function"),
    salaryBandCode: formData.get("salary_band_code"),
    sectorId: formData.get("sector_id"),
    severityCode: formData.get("severity_code"),
    shiftId: formData.get("shift_id"),
    unitId: formData.get("unit_id"),
  });

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const {
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
    title,
    unitId,
  } = parsed.value;

  const supabase = await createClient();
  const hasMembership = await ensureCompanyMembership(supabase, companyId, auth.user.id);

  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  if (unitId) {
    const { data } = await supabase
      .from("units")
      .select("id")
      .eq("id", unitId)
      .eq("company_id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (!data) {
      return { error: "Selecione uma unidade válida." };
    }
  }

  if (sectorId) {
    const { data } = await supabase
      .from("sectors")
      .select("id")
      .eq("id", sectorId)
      .eq("company_id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (!data) {
      return { error: "Selecione um setor válido." };
    }
  }

  if (shiftId) {
    const { data } = await supabase
      .from("shifts")
      .select("id")
      .eq("id", shiftId)
      .eq("company_id", companyId)
      .eq("active", true)
      .maybeSingle();

    if (!data) {
      return { error: "Selecione um turno válido." };
    }
  }

  const [severity, contractType, salaryBand, issueType] = await Promise.all([
    supabase
      .from("severity_levels")
      .select("code")
      .eq("code", severityCode)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("contract_types")
      .select("code")
      .eq("code", contractTypeCode)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("salary_bands")
      .select("code")
      .eq("code", salaryBandCode)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("issue_types")
      .select("code, label")
      .eq("code", issueTypeCode)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!severity.data || !contractType.data || !salaryBand.data || !issueType.data) {
    return { error: "Escolha opções válidas para vínculo, faixa, problema e gravidade." };
  }

  const { data: report, error: reportError } = await supabase
    .from("economic_reports")
    .insert({
      company_id: companyId,
      contract_type_code: contractTypeCode,
      created_by_profile_id: auth.user.id,
      description,
      formal_role: formalRole,
      issue_type_code: issueTypeCode,
      real_function: realFunction,
      salary_band_code: salaryBandCode,
      sector_id: sectorId,
      severity_code: severityCode,
      shift_id: shiftId,
      source_profile_id: auth.user.id,
      title,
      unit_id: unitId,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return { error: "Não conseguimos registrar a pauta econômica agora." };
  }

  const attachments = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let attachmentFailures = 0;
  const attachmentRows: Array<{
    byte_size: number | null;
    company_id: string;
    economic_report_id: string;
    file_name: string;
    mime_type: string | null;
    storage_bucket: string;
    storage_path: string;
    uploader_profile_id: string;
  }> = [];
  const uploadedPaths: string[] = [];

  for (const file of attachments) {
    if (file.size > maxAttachmentSizeBytes) {
      attachmentFailures += 1;
      continue;
    }

    const storagePath = `${companyId}/${report.id}/${randomUUID()}-${normalizeFilename(file.name || "anexo")}`;
    const uploadResult = await supabase.storage.from(economicAttachmentsBucket).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadResult.error) {
      attachmentFailures += 1;
      continue;
    }

    uploadedPaths.push(storagePath);
    attachmentRows.push({
      byte_size: file.size,
      company_id: companyId,
      economic_report_id: report.id,
      file_name: file.name || "anexo",
      mime_type: file.type || null,
      storage_bucket: economicAttachmentsBucket,
      storage_path: storagePath,
      uploader_profile_id: auth.user.id,
    });
  }

  if (attachmentRows.length > 0) {
    const { error: attachmentInsertError } = await supabase
      .from("economic_report_attachments")
      .insert(attachmentRows);

    if (attachmentInsertError) {
      attachmentFailures += 1;
      await supabase.storage.from(economicAttachmentsBucket).remove(uploadedPaths);
    }
  }

  revalidatePath("/economico");
  revalidatePath("/economico/meus");
  revalidatePath(`/economico/${report.id}`);

  redirect(
    `/economico/${report.id}?status=${attachmentFailures > 0 ? "criado-com-alerta" : "criado"}`,
  );
}

export async function confirmEconomicReportAction(
  _: EconomicReportConfirmationActionState,
  formData: FormData,
): Promise<EconomicReportConfirmationActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const parsedConfirmation = parseReportConfirmationInput({
    confirmationTypeCode: formData.get("confirmation_type_code"),
    reportId: formData.get("economic_report_id"),
  });

  if ("error" in parsedConfirmation) {
    return { error: parsedConfirmation.error };
  }

  const { reportId, confirmationTypeCode } = parsedConfirmation.value;

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("economic_reports")
    .select("id, company_id, created_by_profile_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return { error: "Registro econômico não encontrado." };
  }

  if (report.created_by_profile_id === auth.user.id) {
    return { error: "O autor do registro não confirma o próprio registro." };
  }

  const hasMembership = await ensureCompanyMembership(supabase, report.company_id, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  const { error } = await supabase.from("economic_report_confirmations").upsert(
    {
      company_id: report.company_id,
      confirmation_type_code: confirmationTypeCode,
      economic_report_id: reportId,
      profile_id: auth.user.id,
    },
    {
      onConflict: "economic_report_id,profile_id",
    },
  );

  if (error) {
    return { error: "Não foi possível confirmar este registro agora." };
  }

  revalidatePath("/economico/meus");
  revalidatePath(`/economico/${reportId}`);
  redirect(`/economico/${reportId}?status=confirmado`);
}
