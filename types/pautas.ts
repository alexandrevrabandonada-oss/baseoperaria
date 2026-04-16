import type { DemandKind, DemandStatus } from "@/lib/supabase/types";

export const pautaKindOptions = [
  { code: "conditions", label: "Condições de trabalho" },
  { code: "economic", label: "Pauta econômica" },
  { code: "mixed", label: "Mista" },
] as const satisfies ReadonlyArray<{ code: DemandKind; label: string }>;

export const pautaStatusOptions = [
  { code: "draft", label: "Rascunho" },
  { code: "open", label: "Aberta" },
  { code: "planned", label: "Preparada" },
  { code: "in_progress", label: "Em curso" },
  { code: "completed", label: "Encerrada" },
  { code: "cancelled", label: "Suspensa" },
] as const satisfies ReadonlyArray<{ code: DemandStatus; label: string }>;

export type PautaKind = DemandKind;
export type PautaStatus = DemandStatus;

export type PautaFormActionState = {
  error?: string;
};

export type PautaSupportActionState = {
  error?: string;
};

export function labelPautaKind(kind: DemandKind) {
  return pautaKindOptions.find((option) => option.code === kind)?.label ?? kind;
}

export function labelPautaStatus(status: DemandStatus) {
  return pautaStatusOptions.find((option) => option.code === status)?.label ?? status;
}
