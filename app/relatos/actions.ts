"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import {
  parseReportConfirmationInput,
  parseReportCreateInput,
} from "@/lib/validation/workflows";
import type { ReportConfirmationActionState, ReportFormActionState } from "@/types/relatos";

const reportAttachmentsBucket = "report-attachments";
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
  const { data, error } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("company_id", companyId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    console.error("[relatos] falha ao verificar membership", {
      companyId,
      message: error.message,
      profileId,
    });
    return false;
  }

  return Boolean(data);
}

async function cleanupUploadedReportFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadedPaths: string[],
  reportId: string,
) {
  if (uploadedPaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(reportAttachmentsBucket)
    .remove(uploadedPaths);

  if (error) {
    console.error("[relatos] falha na limpeza de anexos apos erro de persistencia", {
      message: error.message,
      reportId,
      uploadedPaths,
    });
  }
}

export async function createReportAction(
  _: ReportFormActionState,
  formData: FormData,
): Promise<ReportFormActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const parsed = parseReportCreateInput({
    categoryId: formData.get("category_id"),
    companyId: formData.get("company_id"),
    description: formData.get("description"),
    frequencyCode: formData.get("frequency_code"),
    sectorId: formData.get("sector_id"),
    severityCode: formData.get("severity_code"),
    shiftId: formData.get("shift_id"),
    title: formData.get("title"),
    unitId: formData.get("unit_id"),
  });

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { companyId, unitId, sectorId, shiftId, categoryId, severityCode, frequencyCode, title, description } =
    parsed.value;

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

  if (!categoryId) {
    return { error: "Selecione uma categoria." };
  }

  const { data: category } = await supabase
    .from("report_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("company_id", companyId)
    .eq("category_kind", "conditions")
    .eq("active", true)
    .maybeSingle();

  if (!category) {
    return { error: "Selecione uma categoria de relato válida." };
  }

  const { data: severity } = await supabase
    .from("severity_levels")
    .select("code")
    .eq("code", severityCode)
    .eq("active", true)
    .maybeSingle();

  const { data: frequency } = await supabase
    .from("frequency_levels")
    .select("code")
    .eq("code", frequencyCode)
    .eq("active", true)
    .maybeSingle();

  if (!severity || !frequency) {
    return { error: "Escolha gravidade e frequência válidas." };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      category_id: category.id,
      company_id: companyId,
      created_by_profile_id: auth.user.id,
      description,
      frequency_code: frequencyCode,
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
    console.error("[relatos] falha ao inserir relato", {
      code: reportError?.code,
      companyId,
      message: reportError?.message,
      userId: auth.user.id,
    });
    return { error: "Não conseguimos registrar o relato agora." };
  }

  const attachments = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let attachmentFailures = 0;
  const attachmentRows: Array<{
    byte_size: number | null;
    company_id: string;
    file_name: string;
    mime_type: string | null;
    report_id: string;
    storage_bucket: string;
    storage_path: string;
    uploader_profile_id: string;
  }> = [];
  const uploadedPaths: string[] = [];

  for (const file of attachments) {
    if (file.size > maxAttachmentSizeBytes) {
      attachmentFailures += 1;
      console.warn("[relatos] anexo ignorado por tamanho", {
        fileName: file.name,
        maxAttachmentSizeBytes,
        reportId: report.id,
        size: file.size,
      });
      continue;
    }

    const storagePath = `${companyId}/${report.id}/${randomUUID()}-${normalizeFilename(file.name || "anexo")}`;
    const uploadResult = await supabase.storage.from(reportAttachmentsBucket).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadResult.error) {
      attachmentFailures += 1;
      console.error("[relatos] falha no upload de anexo", {
        fileName: file.name,
        message: uploadResult.error.message,
        reportId: report.id,
        storagePath,
      });
      continue;
    }

    uploadedPaths.push(storagePath);
    attachmentRows.push({
      byte_size: file.size,
      company_id: companyId,
      file_name: file.name || "anexo",
      mime_type: file.type || null,
      report_id: report.id,
      storage_bucket: reportAttachmentsBucket,
      storage_path: storagePath,
      uploader_profile_id: auth.user.id,
    });
  }

  if (attachmentRows.length > 0) {
    const { error: attachmentInsertError } = await supabase
      .from("report_attachments")
      .insert(attachmentRows);

    if (attachmentInsertError) {
      attachmentFailures += 1;
      console.error("[relatos] falha ao persistir metadados de anexos", {
        code: attachmentInsertError.code,
        message: attachmentInsertError.message,
        reportId: report.id,
      });
      await cleanupUploadedReportFiles(supabase, uploadedPaths, report.id);
    }
  }

  revalidatePath("/relatos");
  revalidatePath("/relatos/meus");
  revalidatePath(`/relatos/${report.id}`);

  redirect(
    `/relatos/${report.id}?status=${attachmentFailures > 0 ? "criado-com-alerta" : "criado"}`,
  );
}

export async function confirmReportAction(
  _: ReportConfirmationActionState,
  formData: FormData,
): Promise<ReportConfirmationActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const parsed = parseReportConfirmationInput({
    confirmationTypeCode: formData.get("confirmation_type_code"),
    reportId: formData.get("report_id"),
  });

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { reportId, confirmationTypeCode } = parsed.value;

  const supabase = await createClient();
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, company_id, created_by_profile_id")
    .eq("id", reportId)
    .maybeSingle();

  if (reportError) {
    console.error("[relatos] falha ao carregar relato para confirmacao", {
      code: reportError.code,
      message: reportError.message,
      reportId,
      userId: auth.user.id,
    });
    return { error: "Não foi possível confirmar este relato agora." };
  }

  if (!report) {
    return { error: "Relato não encontrado." };
  }

  if (report.created_by_profile_id === auth.user.id) {
    return { error: "O autor do relato não confirma o próprio relato." };
  }

  const hasMembership = await ensureCompanyMembership(supabase, report.company_id, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  const { error } = await supabase.from("report_confirmations").upsert(
    {
      company_id: report.company_id,
      confirmation_type_code: confirmationTypeCode,
      profile_id: auth.user.id,
      report_id: reportId,
    },
    {
      onConflict: "report_id,profile_id",
    },
  );

  if (error) {
    console.error("[relatos] falha ao salvar confirmacao", {
      code: error.code,
      message: error.message,
      reportId,
      userId: auth.user.id,
    });
    return { error: "Não foi possível confirmar este relato agora." };
  }

  revalidatePath("/relatos/meus");
  revalidatePath(`/relatos/${reportId}`);
  redirect(`/relatos/${reportId}?status=confirmado`);
}
