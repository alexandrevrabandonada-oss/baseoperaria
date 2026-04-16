"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getModerationWorkspaceContext, recordModerationEvent } from "@/lib/supabase/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= max ? normalized : null;
}

function normalizeCode(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeUuid(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized,
  )
    ? normalized
    : null;
}

function normalizePath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.startsWith("/moderacao") ||
    trimmed.startsWith("/relatos") ||
    trimmed.startsWith("/economico") ||
    trimmed.startsWith("/admin/clusters")
    ? trimmed
    : fallback;
}

function redirectBack(returnTo: string, status: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}status=${status}`);
}

function revalidateModeration(companyId: string, entityId?: string) {
  revalidatePath("/moderacao");
  revalidatePath(`/moderacao?company_id=${companyId}`);
  revalidatePath("/relatos");
  revalidatePath("/relatos/meus");
  revalidatePath("/economico");
  revalidatePath("/economico/meus");
  revalidatePath("/pautas");
  revalidatePath("/admin/clusters");

  if (entityId) {
    revalidatePath(`/relatos/${entityId}`);
    revalidatePath(`/economico/${entityId}`);
    revalidatePath(`/admin/clusters/${entityId}`);
  }
}

async function getModerationContext(companyId: string) {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const workspace = await getModerationWorkspaceContext(companyId);

  if (!workspace.selectedCompany) {
    return null;
  }

  return {
    auth,
    workspace,
  };
}

async function ensureReportBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("reports")
    .select("id, company_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

async function ensureEconomicReportBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("economic_reports")
    .select("id, company_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

async function ensureClusterBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clusterId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("issue_clusters")
    .select("id, company_id")
    .eq("id", clusterId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

async function ensureReportAttachmentBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attachmentId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("report_attachments")
    .select("id, company_id, report_id")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

async function ensureEconomicAttachmentBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attachmentId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("economic_report_attachments")
    .select("id, company_id, economic_report_id")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

export async function attachReportToClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("report_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));

  if (!companyId || !reportId || !clusterId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureReportBelongsToCompany(supabase, reportId, workspace.selectedCompany.id);
  const cluster = await ensureClusterBelongsToCompany(
    supabase,
    clusterId,
    workspace.selectedCompany.id,
  );

  if (!report || !cluster) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error } = await supabase.from("cluster_reports").insert({
    cluster_id: clusterId,
    company_id: workspace.selectedCompany.id,
    created_by_profile_id: auth.user.id,
    report_id: reportId,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  const moderationEvent = await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      source: "moderacao",
    },
    entityId: reportId,
    entityType: "report",
  });

  if (moderationEvent.error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  revalidatePath(`/admin/clusters/${clusterId}`);
  redirectBack(returnTo, "vinculo-salvo");
}

export async function attachEconomicReportToClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("economic_report_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));

  if (!companyId || !reportId || !clusterId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureEconomicReportBelongsToCompany(
    supabase,
    reportId,
    workspace.selectedCompany.id,
  );
  const cluster = await ensureClusterBelongsToCompany(
    supabase,
    clusterId,
    workspace.selectedCompany.id,
  );

  if (!report || !cluster) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error } = await supabase.from("cluster_economic_reports").insert({
    cluster_id: clusterId,
    company_id: workspace.selectedCompany.id,
    created_by_profile_id: auth.user.id,
    economic_report_id: reportId,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  const moderationEvent = await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      source: "moderacao",
    },
    entityId: reportId,
    entityType: "economic_report",
  });

  if (moderationEvent.error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  revalidatePath(`/admin/clusters/${clusterId}`);
  redirectBack(returnTo, "vinculo-salvo");
}

export async function flagReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("report_id"));
  const reason = normalizeText(formData.get("reason"), 240);

  if (!companyId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureReportBelongsToCompany(supabase, reportId, workspace.selectedCompany.id);

  if (!report) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({ status: "triaged" })
    .eq("id", reportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (updateError) {
    redirectBack(returnTo, "erro");
  }

  const { error } = await recordModerationEvent(supabase, {
    actionCode: "flag",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      next_status: "triaged",
    },
    entityId: reportId,
    entityType: "report",
    reason,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  redirectBack(returnTo, "relato-sinalizado");
}

export async function archiveReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("report_id"));
  const reason = normalizeText(formData.get("reason"), 240);

  if (!companyId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureReportBelongsToCompany(supabase, reportId, workspace.selectedCompany.id);

  if (!report) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({ status: "archived" })
    .eq("id", reportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (updateError) {
    redirectBack(returnTo, "erro");
  }

  const { error } = await recordModerationEvent(supabase, {
    actionCode: "archive",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      next_status: "archived",
    },
    entityId: reportId,
    entityType: "report",
    reason,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  redirectBack(returnTo, "relato-arquivado");
}

export async function flagEconomicReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("economic_report_id"));
  const reason = normalizeText(formData.get("reason"), 240);

  if (!companyId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureEconomicReportBelongsToCompany(
    supabase,
    reportId,
    workspace.selectedCompany.id,
  );

  if (!report) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error: updateError } = await supabase
    .from("economic_reports")
    .update({ status: "triaged" })
    .eq("id", reportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (updateError) {
    redirectBack(returnTo, "erro");
  }

  const { error } = await recordModerationEvent(supabase, {
    actionCode: "flag",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      next_status: "triaged",
    },
    entityId: reportId,
    entityType: "economic_report",
    reason,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  redirectBack(returnTo, "economico-sinalizado");
}

export async function archiveEconomicReportAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const reportId = normalizeUuid(formData.get("economic_report_id"));
  const reason = normalizeText(formData.get("reason"), 240);

  if (!companyId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();
  const report = await ensureEconomicReportBelongsToCompany(
    supabase,
    reportId,
    workspace.selectedCompany.id,
  );

  if (!report) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error: updateError } = await supabase
    .from("economic_reports")
    .update({ status: "archived" })
    .eq("id", reportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (updateError) {
    redirectBack(returnTo, "erro");
  }

  const { error } = await recordModerationEvent(supabase, {
    actionCode: "archive",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      next_status: "archived",
    },
    entityId: reportId,
    entityType: "economic_report",
    reason,
  });

  if (error) {
    redirectBack(returnTo, "erro");
  }

  revalidateModeration(workspace.selectedCompany.id, reportId);
  redirectBack(returnTo, "economico-arquivado");
}

export async function flagAttachmentAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/moderacao", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/moderacao");
  const companyId = normalizeUuid(formData.get("company_id"));
  const attachmentId = normalizeUuid(formData.get("attachment_id"));
  const attachmentKind = normalizeCode(formData.get("attachment_kind"));
  const reason = normalizeText(formData.get("reason"), 240);

  if (!companyId || !attachmentId || !attachmentKind) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getModerationContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, workspace } = context;
  if (!workspace.selectedCompany) {
    redirectBack(returnTo, "sem-permissao");
  }
  const supabase = await createClient();

  if (attachmentKind === "report_attachment") {
    const attachment = await ensureReportAttachmentBelongsToCompany(
      supabase,
      attachmentId,
      workspace.selectedCompany.id,
    );

    if (!attachment) {
      redirectBack(returnTo, "dados-invalidos");
    }

    const { error } = await recordModerationEvent(supabase, {
      actionCode: "attachment_flag",
      actorProfileId: auth.user.id,
      companyId: workspace.selectedCompany.id,
      details: {
        attachment_id: attachmentId,
        report_id: attachment.report_id,
      },
      entityId: attachmentId,
      entityType: "report_attachment",
      reason,
    });

    if (error) {
      redirectBack(returnTo, "erro");
    }

    revalidateModeration(workspace.selectedCompany.id, attachment.report_id);
    redirectBack(returnTo, "anexo-sinalizado");
  }

  if (attachmentKind === "economic_report_attachment") {
    const attachment = await ensureEconomicAttachmentBelongsToCompany(
      supabase,
      attachmentId,
      workspace.selectedCompany.id,
    );

    if (!attachment) {
      redirectBack(returnTo, "dados-invalidos");
    }

    const { error } = await recordModerationEvent(supabase, {
      actionCode: "attachment_flag",
      actorProfileId: auth.user.id,
      companyId: workspace.selectedCompany.id,
      details: {
        attachment_id: attachmentId,
        economic_report_id: attachment.economic_report_id,
      },
      entityId: attachmentId,
      entityType: "economic_report_attachment",
      reason,
    });

    if (error) {
      redirectBack(returnTo, "erro");
    }

    revalidateModeration(workspace.selectedCompany.id, attachment.economic_report_id);
    redirectBack(returnTo, "anexo-sinalizado");
  }

  redirectBack(returnTo, "dados-invalidos");
}
