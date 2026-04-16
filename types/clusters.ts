export const clusterStatusOptions = [
  { code: "open", label: "Aberto" },
  { code: "triaged", label: "Triado" },
  { code: "resolved", label: "Resolvido" },
  { code: "closed", label: "Fechado" },
  { code: "archived", label: "Arquivado" },
] as const;

export type ClusterStatusCode = (typeof clusterStatusOptions)[number]["code"];

export const clusterScopeLabels = {
  conditions: "Condições",
  economic: "Econômico",
  mixed: "Misto",
  undefined: "Sem classificação",
} as const;

export type ClusterScope = keyof typeof clusterScopeLabels;

export type ClusterFormActionState = {
  error?: string;
};

export type ClusterLinkActionState = {
  error?: string;
};
