export const moderationActionOptions = [
  { code: "review", label: "Revisto" },
  { code: "flag", label: "Marcado" },
  { code: "archive", label: "Arquivado" },
  { code: "cluster_link", label: "Ligado ao cluster" },
  { code: "attachment_flag", label: "Anexo marcado" },
] as const;

export type ModerationActionCode = (typeof moderationActionOptions)[number]["code"];

export function labelModerationAction(actionCode: ModerationActionCode) {
  return moderationActionOptions.find((option) => option.code === actionCode)?.label ?? actionCode;
}

export const moderationEntityLabels = {
  action: "Encaminhamento",
  company: "Empresa",
  demand: "Pauta",
  economic_report: "Registro econômico",
  economic_report_attachment: "Anexo econômico",
  issue_cluster: "Cluster",
  nucleus: "Núcleo",
  report: "Relato",
  report_attachment: "Anexo de relato",
} as const;

export type ModerationEntityLabel = keyof typeof moderationEntityLabels;
