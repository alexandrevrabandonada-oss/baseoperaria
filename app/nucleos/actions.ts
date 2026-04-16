"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAuthContext } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { getNucleusCreateContext } from "@/lib/supabase/nucleos";
import {
  nucleusActionStatusOptions,
  nucleusActionTypeOptions,
  nucleusMemberRoleOptions,
  nucleusScopeOptions,
  type NucleusActionStatusCode,
  type NucleusActionTypeCode,
  type NucleusMemberRoleCode,
  type NucleusScope,
} from "@/types/nucleos";
import type {
  NucleusActionState,
  NucleusFormActionState,
  NucleusMemberActionState,
} from "@/types/nucleos";

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
  return trimmed.startsWith("/nucleos") || trimmed.startsWith("/pautas")
    ? trimmed
    : fallback;
}

function normalizeCode<T extends string>(
  value: FormDataEntryValue | null,
  allowed: ReadonlyArray<T>,
): T | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return allowed.includes(trimmed as T) ? (trimmed as T) : null;
}

function redirectBack(returnTo: string, status: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}status=${status}`);
}

function revalidateNucleos(companyId?: string, nucleusId?: string, demandId?: string) {
  revalidatePath("/nucleos");

  if (companyId) {
    revalidatePath(`/nucleos?company_id=${companyId}`);
  }

  if (nucleusId) {
    revalidatePath(`/nucleos/${nucleusId}`);
  }

  if (demandId) {
    revalidatePath(`/pautas/${demandId}`);
  }
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

async function getAdminNucleusContext(companyId: string) {
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

async function ensureNucleusBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nucleusId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("nuclei")
    .select("id, company_id, status")
    .eq("id", nucleusId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

async function ensureDemandBelongsToCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  demandId: string,
  companyId: string,
) {
  const { data } = await supabase
    .from("demands")
    .select("id, company_id")
    .eq("id", demandId)
    .maybeSingle();

  if (!data || data.company_id !== companyId) {
    return null;
  }

  return data;
}

export async function saveNucleusAction(
  _: NucleusFormActionState,
  formData: FormData,
): Promise<NucleusFormActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const companyId = normalizeUuid(formData.get("company_id"));
  const title = normalizeText(formData.get("title"), { min: 2, max: 120 });
  const description = normalizeText(formData.get("description"), { min: 1, max: 240 });
  const scopeKind = normalizeCode(formData.get("scope_kind"), nucleusScopeOptions.map((option) => option.code));
  const sectorId = normalizeUuid(formData.get("sector_id"));
  const theme = normalizeOptionalText(formData.get("theme"), 120);
  const returnTo = normalizePath(formData.get("return_to"), "/nucleos");

  if (!companyId || !title || !description || !scopeKind) {
    return { error: "Preencha empresa, título, descrição e escopo." };
  }

  const context = await getNucleusCreateContext(companyId);
  if (!context || context.companyId !== companyId) {
    return { error: "Você não tem permissão para criar núcleos nesta empresa." };
  }

  const supabase = await createClient();
  const hasMembership = await ensureCompanyMembership(supabase, companyId, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  if (scopeKind === "sector") {
    if (!sectorId || !context.sectorOptions.some((option) => option.id === sectorId)) {
      return { error: "Selecione um setor válido para este núcleo." };
    }

    if (theme) {
      return { error: "Deixe o tema em branco quando o escopo for por setor." };
    }
  }

  if (scopeKind === "theme") {
    if (!theme) {
      return { error: "Informe o tema do núcleo." };
    }

    if (sectorId) {
      return { error: "Deixe o setor em branco quando o escopo for por tema." };
    }
  }

  const { data: nucleus, error } = await supabase
    .from("nuclei")
    .insert({
      company_id: companyId,
      created_by_profile_id: auth.user.id,
      description,
      name: title,
      scope_kind: scopeKind as NucleusScope,
      sector_id: scopeKind === "sector" ? sectorId : null,
      status: "active",
      theme: scopeKind === "theme" ? theme : null,
    })
    .select("id")
    .single();

  if (error || !nucleus) {
    return { error: "Não foi possível salvar o núcleo agora." };
  }

  const { error: membershipError } = await supabase.from("nucleus_members").upsert(
    {
      company_id: companyId,
      nucleus_id: nucleus.id,
      profile_id: auth.user.id,
      role: "lead" as NucleusMemberRoleCode,
    },
    { onConflict: "nucleus_id,profile_id" },
  );

  if (membershipError) {
    return { error: "Núcleo criado, mas não foi possível registrar sua adesão." };
  }

  revalidateNucleos(companyId, nucleus.id);
  redirectBack(returnTo, "nucleo-salvo");
}

export async function toggleMyNucleusMembershipAction(
  _: NucleusMemberActionState,
  formData: FormData,
): Promise<NucleusMemberActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const companyId = normalizeUuid(formData.get("company_id"));
  const nucleusId = normalizeUuid(formData.get("nucleus_id"));
  const returnTo = normalizePath(formData.get("return_to"), "/nucleos");

  if (!companyId || !nucleusId) {
    return { error: "Dados inválidos para alterar sua adesão." };
  }

  const supabase = await createClient();
  const nucleus = await ensureNucleusBelongsToCompany(supabase, nucleusId, companyId);
  if (!nucleus) {
    return { error: "Núcleo não encontrado." };
  }

  if (nucleus.status === "archived") {
    return { error: "Núcleo arquivado não permite novas adesões." };
  }

  const hasMembership = await ensureCompanyMembership(supabase, companyId, auth.user.id);
  if (!hasMembership) {
    return { error: "Você não tem acesso a essa empresa." };
  }

  const { data: existingMembership } = await supabase
    .from("nucleus_members")
    .select("nucleus_id")
    .eq("company_id", companyId)
    .eq("nucleus_id", nucleusId)
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  if (existingMembership) {
    const { error } = await supabase
      .from("nucleus_members")
      .delete()
      .eq("company_id", companyId)
      .eq("nucleus_id", nucleusId)
      .eq("profile_id", auth.user.id);

    if (error) {
      return { error: "Não foi possível sair do núcleo agora." };
    }

    revalidateNucleos(companyId, nucleusId);
    redirectBack(returnTo, "membro-removido");
  }

  const { error } = await supabase.from("nucleus_members").insert({
    company_id: companyId,
    nucleus_id: nucleusId,
    profile_id: auth.user.id,
    role: "member",
  });

  if (error) {
    return { error: "Não foi possível registrar sua adesão agora." };
  }

  revalidateNucleos(companyId, nucleusId);
  redirectBack(returnTo, "membro-salvo");
}

export async function saveNucleusMemberAction(
  _: NucleusMemberActionState,
  formData: FormData,
): Promise<NucleusMemberActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const companyId = normalizeUuid(formData.get("company_id"));
  const nucleusId = normalizeUuid(formData.get("nucleus_id"));
  const profileId = normalizeUuid(formData.get("profile_id"));
  const role = normalizeCode(formData.get("role"), nucleusMemberRoleOptions.map((option) => option.code));
  const returnTo = normalizePath(formData.get("return_to"), "/nucleos");

  if (!companyId || !nucleusId || !profileId || !role) {
    return { error: "Preencha empresa, núcleo, membro e papel." };
  }

  const context = await getAdminNucleusContext(companyId);
  if (!context || context.workspace.selectedCompany.id !== companyId) {
    return { error: "Você não tem permissão para administrar este núcleo." };
  }

  const { supabase } = context;
  const nucleus = await ensureNucleusBelongsToCompany(supabase, nucleusId, companyId);
  if (!nucleus) {
    return { error: "Núcleo não encontrado." };
  }

  if (nucleus.status === "archived") {
    return { error: "Núcleo arquivado não permite novos membros." };
  }

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("profile_id")
    .eq("company_id", companyId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) {
    return { error: "Selecione um membro válido da empresa." };
  }

  const { error } = await supabase.from("nucleus_members").upsert(
    {
      company_id: companyId,
      nucleus_id: nucleusId,
      profile_id: profileId,
      role: role as NucleusMemberRoleCode,
    },
    { onConflict: "nucleus_id,profile_id" },
  );

  if (error) {
    return { error: "Não foi possível salvar o membro agora." };
  }

  revalidateNucleos(companyId, nucleusId);
  redirectBack(returnTo, "membro-salvo");
}

export async function saveNucleusEncaminhamentoAction(
  _: NucleusActionState,
  formData: FormData,
): Promise<NucleusActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado." };
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirect("/entrar");
  }

  const companyId = normalizeUuid(formData.get("company_id"));
  const nucleusId = normalizeUuid(formData.get("nucleus_id"));
  const demandId = normalizeUuid(formData.get("demand_id"));
  const title = normalizeText(formData.get("title"), { min: 2, max: 120 });
  const details = normalizeOptionalText(formData.get("details"), 240);
  const actionType = normalizeCode(
    formData.get("action_type"),
    nucleusActionTypeOptions.map((option) => option.code),
  );
  const status = normalizeCode(
    formData.get("status"),
    nucleusActionStatusOptions.map((option) => option.code),
  );
  const returnTo = normalizePath(formData.get("return_to"), "/nucleos");

  if (!companyId || !nucleusId || !title || !actionType || !status) {
    return { error: "Preencha empresa, núcleo, título, tipo e status." };
  }

  const context = await getAdminNucleusContext(companyId);
  if (!context || context.workspace.selectedCompany.id !== companyId) {
    return { error: "Você não tem permissão para criar encaminhamentos neste núcleo." };
  }

  const { supabase } = context;
  const nucleus = await ensureNucleusBelongsToCompany(supabase, nucleusId, companyId);
  if (!nucleus) {
    return { error: "Núcleo não encontrado." };
  }

  if (nucleus.status === "archived") {
    return { error: "Núcleo arquivado não permite novos encaminhamentos." };
  }

  if (demandId) {
    const demand = await ensureDemandBelongsToCompany(supabase, demandId, companyId);
    if (!demand) {
      return { error: "Selecione uma pauta válida." };
    }
  }

  const { error } = await supabase.from("actions").insert({
    action_type: actionType as NucleusActionTypeCode,
    company_id: companyId,
    created_by_profile_id: auth.user.id,
    demand_id: demandId,
    completed_at: status === "done" ? new Date().toISOString() : null,
    details,
    nucleus_id: nucleusId,
    status: status as NucleusActionStatusCode,
    title,
  });

  if (error) {
    return { error: "Não foi possível salvar o encaminhamento agora." };
  }

  revalidateNucleos(companyId, nucleusId, demandId ?? undefined);
  redirectBack(returnTo, "acao-salva");
}
