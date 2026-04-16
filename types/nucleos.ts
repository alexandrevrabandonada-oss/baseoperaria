import type { NucleusScopeKind, NucleusStatus, NucleusMemberRole } from "@/lib/supabase/types";
import type { ActionStatus, ActionType } from "@/lib/supabase/types";

export const nucleusScopeOptions = [
  { code: "sector", label: "Setor" },
  { code: "theme", label: "Tema" },
] as const satisfies ReadonlyArray<{ code: NucleusScopeKind; label: string }>;

export const nucleusStatusOptions = [
  { code: "active", label: "Ativo" },
  { code: "archived", label: "Arquivado" },
] as const satisfies ReadonlyArray<{ code: NucleusStatus; label: string }>;

export const nucleusMemberRoleOptions = [
  { code: "lead", label: "Liderança" },
  { code: "member", label: "Membro" },
  { code: "observer", label: "Observador" },
] as const satisfies ReadonlyArray<{ code: NucleusMemberRole; label: string }>;

export const nucleusActionTypeOptions = [
  { code: "meeting", label: "Reunião" },
  { code: "campaign", label: "Campanha" },
  { code: "follow_up", label: "Seguimento" },
  { code: "negotiation", label: "Negociação" },
  { code: "inspection", label: "Fiscalização" },
  { code: "other", label: "Outro" },
] as const;

export const nucleusActionStatusOptions = [
  { code: "planned", label: "Planejada" },
  { code: "active", label: "Ativa" },
  { code: "done", label: "Concluída" },
  { code: "cancelled", label: "Cancelada" },
] as const satisfies ReadonlyArray<{ code: ActionStatus; label: string }>;

export type NucleusScope = NucleusScopeKind;
export type NucleusStatusCode = NucleusStatus;
export type NucleusMemberRoleCode = NucleusMemberRole;
export type NucleusActionTypeCode = ActionType;
export type NucleusActionStatusCode = ActionStatus;

export type NucleusFormActionState = {
  error?: string;
};

export type NucleusMemberActionState = {
  error?: string;
};

export type NucleusActionState = {
  error?: string;
};
