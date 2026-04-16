"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { recordModerationEvent } from "@/lib/supabase/moderation";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { clusterStatusOptions, type ClusterStatusCode } from "@/types/clusters";

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
  return trimmed.startsWith("/admin/clusters") ? trimmed : fallback;
}

function normalizeStatus(value: FormDataEntryValue | null): ClusterStatusCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return clusterStatusOptions.some((option) => option.code === normalized)
    ? (normalized as ClusterStatusCode)
    : null;
}

function isUniqueViolation(error: { code?: string | null } | null | undefined) {
  return error?.code === "23505";
}

function revalidateClusters(clusterId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clusters");

  if (clusterId) {
    revalidatePath(`/admin/clusters/${clusterId}`);
  }
}

function redirectBack(returnTo: string, status: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}status=${status}`);
}

async function getAdminClusterContext(companyId: string) {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const supabase = await createClient();
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.selectedCompany) {
    return null;
  }

  return {
    auth,
    supabase,
    workspace,
  };
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

async function ensureCategoryBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("report_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("company_id", companyId)
    .maybeSingle();

  return data ?? null;
}

export async function saveClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/clusters", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/admin/clusters");
  const companyId = normalizeUuid(formData.get("company_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));
  const title = normalizeText(formData.get("title"), { min: 2, max: 120 });
  const summary = normalizeOptionalText(formData.get("summary"), 240);
  const categoryId = normalizeUuid(formData.get("category_id"));
  const status = normalizeStatus(formData.get("status"));

  if (!companyId || !title || !status) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getAdminClusterContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, supabase, workspace } = context;

  if (categoryId) {
    const category = await ensureCategoryBelongsToCompany(supabase, categoryId, workspace.selectedCompany.id);

    if (!category) {
      redirectBack(returnTo, "dados-invalidos");
    }
  }

  if (!clusterId) {
    const { data, error } = await supabase
      .from("issue_clusters")
      .insert({
        category_id: categoryId,
        company_id: workspace.selectedCompany.id,
        created_by_profile_id: auth.user.id,
        status,
        summary,
        title,
      })
      .select("id")
      .single();

    if (isUniqueViolation(error)) {
      redirectBack(returnTo, "cluster-ja-existente");
    }

    if (error || !data) {
      redirectBack(returnTo, "erro");
    }

    await recordModerationEvent(supabase, {
      actionCode: "review",
      actorProfileId: auth.user.id,
      companyId: workspace.selectedCompany.id,
      details: { operation: "create" },
      entityId: data.id,
      entityType: "issue_cluster",
    });

    revalidateClusters(data.id);
    redirect(`/admin/clusters/${data.id}?status=cluster-salvo`);
  }

  const cluster = await ensureClusterBelongsToCompany(supabase, clusterId, workspace.selectedCompany.id);

  if (!cluster) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { error } = await supabase
    .from("issue_clusters")
    .update({
      category_id: categoryId,
      status,
      summary,
      title,
    })
    .eq("id", clusterId)
    .eq("company_id", workspace.selectedCompany.id);

  if (isUniqueViolation(error)) {
    redirectBack(returnTo, "cluster-ja-existente");
  }

  if (error) {
    redirectBack(returnTo, "erro");
  }

  await recordModerationEvent(supabase, {
    actionCode: "review",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: { operation: "update" },
    entityId: clusterId,
    entityType: "issue_cluster",
  });

  revalidateClusters(clusterId);
  redirectBack(returnTo, "cluster-salvo");
}

export async function attachReportToClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/clusters", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/admin/clusters");
  const companyId = normalizeUuid(formData.get("company_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));
  const reportId = normalizeUuid(formData.get("report_id"));

  if (!companyId || !clusterId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getAdminClusterContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, supabase, workspace } = context;
  const cluster = await ensureClusterBelongsToCompany(supabase, clusterId, workspace.selectedCompany.id);

  if (!cluster) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { data: report } = await supabase
    .from("reports")
    .select("id, company_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.company_id !== workspace.selectedCompany.id) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error } = await supabase.from("cluster_reports").insert({
    cluster_id: clusterId,
    company_id: workspace.selectedCompany.id,
    created_by_profile_id: auth.user.id,
    report_id: reportId,
  });

  if (isUniqueViolation(error)) {
    redirectBack(returnTo, "vinculo-ja-existente");
  }

  if (error) {
    redirectBack(returnTo, "erro");
  }

  await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      operation: "attach",
      report_id: reportId,
      target: "report",
    },
    entityId: reportId,
    entityType: "report",
  });

  revalidateClusters(clusterId);
  redirectBack(returnTo, "vinculo-salvo");
}

export async function detachReportFromClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/clusters", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/admin/clusters");
  const companyId = normalizeUuid(formData.get("company_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));
  const reportId = normalizeUuid(formData.get("report_id"));

  if (!companyId || !clusterId || !reportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getAdminClusterContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, supabase, workspace } = context;
  const cluster = await ensureClusterBelongsToCompany(supabase, clusterId, workspace.selectedCompany.id);

  if (!cluster) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { error } = await supabase
    .from("cluster_reports")
    .delete()
    .eq("cluster_id", clusterId)
    .eq("report_id", reportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (error) {
    redirectBack(returnTo, "erro");
  }

  await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      operation: "detach",
      report_id: reportId,
      target: "report",
    },
    entityId: reportId,
    entityType: "report",
  });

  revalidateClusters(clusterId);
  redirectBack(returnTo, "vinculo-removido");
}

export async function attachEconomicReportToClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/clusters", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/admin/clusters");
  const companyId = normalizeUuid(formData.get("company_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));
  const economicReportId = normalizeUuid(formData.get("economic_report_id"));

  if (!companyId || !clusterId || !economicReportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getAdminClusterContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, supabase, workspace } = context;
  const cluster = await ensureClusterBelongsToCompany(supabase, clusterId, workspace.selectedCompany.id);

  if (!cluster) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { data: economicReport } = await supabase
    .from("economic_reports")
    .select("id, company_id")
    .eq("id", economicReportId)
    .maybeSingle();

  if (!economicReport || economicReport.company_id !== workspace.selectedCompany.id) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const { error } = await supabase.from("cluster_economic_reports").insert({
    cluster_id: clusterId,
    company_id: workspace.selectedCompany.id,
    created_by_profile_id: auth.user.id,
    economic_report_id: economicReportId,
  });

  if (isUniqueViolation(error)) {
    redirectBack(returnTo, "vinculo-ja-existente");
  }

  if (error) {
    redirectBack(returnTo, "erro");
  }

  await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      economic_report_id: economicReportId,
      operation: "attach",
      target: "economic_report",
    },
    entityId: economicReportId,
    entityType: "economic_report",
  });

  revalidateClusters(clusterId);
  redirectBack(returnTo, "vinculo-salvo");
}

export async function detachEconomicReportFromClusterAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirectBack("/admin/clusters", "erro");
  }

  const returnTo = normalizePath(formData.get("return_to"), "/admin/clusters");
  const companyId = normalizeUuid(formData.get("company_id"));
  const clusterId = normalizeUuid(formData.get("cluster_id"));
  const economicReportId = normalizeUuid(formData.get("economic_report_id"));

  if (!companyId || !clusterId || !economicReportId) {
    redirectBack(returnTo, "dados-invalidos");
  }

  const context = await getAdminClusterContext(companyId);
  if (!context) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { auth, supabase, workspace } = context;
  const cluster = await ensureClusterBelongsToCompany(supabase, clusterId, workspace.selectedCompany.id);

  if (!cluster) {
    redirectBack(returnTo, "sem-permissao");
  }

  const { error } = await supabase
    .from("cluster_economic_reports")
    .delete()
    .eq("cluster_id", clusterId)
    .eq("economic_report_id", economicReportId)
    .eq("company_id", workspace.selectedCompany.id);

  if (error) {
    redirectBack(returnTo, "erro");
  }

  await recordModerationEvent(supabase, {
    actionCode: "cluster_link",
    actorProfileId: auth.user.id,
    companyId: workspace.selectedCompany.id,
    details: {
      cluster_id: clusterId,
      economic_report_id: economicReportId,
      operation: "detach",
      target: "economic_report",
    },
    entityId: economicReportId,
    entityType: "economic_report",
  });

  revalidateClusters(clusterId);
  redirectBack(returnTo, "vinculo-removido");
}
