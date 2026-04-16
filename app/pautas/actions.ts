"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPautaCreateContext } from "@/lib/supabase/pautas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePath,
  normalizeUuid,
  parsePautaCreateInput,
} from "@/lib/validation/workflows";
import type { PautaKind, PautaStatus, PautaFormActionState, PautaSupportActionState } from "@/types/pautas";

function redirectBack(returnTo: string, status: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}status=${status}`);
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

function revalidatePautas(companyId?: string, demandId?: string, clusterId?: string) {
  revalidatePath("/pautas");

  if (companyId) {
    revalidatePath(`/pautas?company_id=${companyId}`);
  }

  if (demandId) {
    revalidatePath(`/pautas/${demandId}`);
  }

  if (clusterId) {
    revalidatePath("/admin/clusters");
    revalidatePath(`/admin/clusters/${clusterId}`);
  }
}

export async function saveDemandAction(
  _: PautaFormActionState,
  formData: FormData,
): Promise<PautaFormActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const parsed = parsePautaCreateInput({
    clusterId: formData.get("cluster_id"),
    companyId: formData.get("company_id"),
    description: formData.get("description"),
    kind: formData.get("kind"),
    priorityCode: formData.get("priority_code"),
    sectorId: formData.get("sector_id"),
    status: formData.get("status"),
    title: formData.get("title"),
    unitId: formData.get("unit_id"),
  });

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { clusterId, companyId, description, kind, priorityCode, sectorId, status, title, unitId } =
    parsed.value;

  const context = await getPautaCreateContext(clusterId);
  if (!context || context.companyId !== companyId) {
    return { error: "Você não tem permissão para criar pauta a partir deste cluster." };
  }

  const supabase = await createClient();
  const hasMembership = await ensureCompanyMembership(supabase, companyId, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  if (
    unitId &&
    !context.unitOptions.some((option) => option.id === unitId)
  ) {
    return { error: "Selecione uma unidade válida." };
  }

  if (
    sectorId &&
    !context.sectorOptions.some((option) => option.id === sectorId)
  ) {
    return { error: "Selecione um setor válido." };
  }

  const { data: demand, error } = await supabase
    .from("demands")
    .insert({
      cluster_id: clusterId,
      company_id: companyId,
      created_by_profile_id: auth.user.id,
      description,
      kind: kind as PautaKind,
      priority_code: priorityCode,
      sector_id: sectorId,
      status: status as PautaStatus,
      title,
      unit_id: unitId,
    })
    .select("id")
    .single();

  if (error || !demand) {
    return { error: "Não foi possível salvar a pauta agora." };
  }

  revalidatePautas(companyId, demand.id, clusterId);
  redirect(`/pautas/${demand.id}?status=pauta-salva`);
}

export async function toggleDemandSupportAction(
  _: PautaSupportActionState,
  formData: FormData,
): Promise<PautaSupportActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const demandId = normalizeUuid(formData.get("demand_id"));
  const companyId = normalizeUuid(formData.get("company_id"));
  const returnTo = normalizePath(formData.get("return_to"), "/pautas");

  if (!demandId || !companyId) {
    return { error: "Dados inválidos para registrar apoio." };
  }

  const supabase = await createClient();
  const { data: demand } = await supabase
    .from("demands")
    .select("id, company_id, created_by_profile_id")
    .eq("id", demandId)
    .maybeSingle();

  if (!demand || demand.company_id !== companyId) {
    return { error: "Pauta não encontrada." };
  }

  const hasMembership = await ensureCompanyMembership(supabase, companyId, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  if (demand.created_by_profile_id === auth.user.id) {
    return { error: "O autor da pauta não confirma o próprio item." };
  }

  const { data: support } = await supabase
    .from("demand_supporters")
    .select("demand_id")
    .eq("demand_id", demandId)
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  if (support) {
    const { error } = await supabase
      .from("demand_supporters")
      .delete()
      .eq("demand_id", demandId)
      .eq("profile_id", auth.user.id)
      .eq("company_id", companyId);

    if (error) {
      return { error: "Não foi possível remover seu apoio agora." };
    }

    revalidatePautas(companyId, demandId);
    redirectBack(returnTo, "apoio-removido");
  }

  const { error } = await supabase.from("demand_supporters").insert({
    company_id: companyId,
    demand_id: demandId,
    profile_id: auth.user.id,
  });

  if (error) {
    return { error: "Não foi possível registrar seu apoio agora." };
  }

  revalidatePautas(companyId, demandId);
  redirectBack(returnTo, "apoio-salvo");
}
