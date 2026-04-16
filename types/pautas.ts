import type { DemandKind, DemandStatus } from "@/lib/supabase/types";

export const pautaKindOptions = [
  { code: "conditions", label: "Condição" },
  { code: "economic", label: "Econômica" },
  { code: "mixed", label: "Mista" },
] as const satisfies ReadonlyArray<{ code: DemandKind; label: string }>;

export const pautaStatusOptions = [
  { code: "draft", label: "Rascunho" },
  { code: "open", label: "Aberta" },
  { code: "planned", label: "Planejada" },
  { code: "in_progress", label: "Em andamento" },
  { code: "completed", label: "Concluída" },
  { code: "cancelled", label: "Cancelada" },
] as const satisfies ReadonlyArray<{ code: DemandStatus; label: string }>;

export type PautaKind = DemandKind;
export type PautaStatus = DemandStatus;

export type PautaFormActionState = {
  error?: string;
};

export type PautaSupportActionState = {
  error?: string;
};
