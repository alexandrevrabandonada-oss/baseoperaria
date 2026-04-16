export const moderationActionOptions = [
  { code: "review", label: "Revisado" },
  { code: "flag", label: "Sinalizado" },
  { code: "archive", label: "Arquivado" },
  { code: "cluster_link", label: "Vinculado ao cluster" },
  { code: "attachment_flag", label: "Anexo sinalizado" },
] as const;

export type ModerationActionCode = (typeof moderationActionOptions)[number]["code"];

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
