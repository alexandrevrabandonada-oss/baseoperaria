export const clusterStatusOptions = [
  { code: "open", label: "Aberto" },
  { code: "triaged", label: "Separado" },
  { code: "resolved", label: "Encaminhado" },
  { code: "closed", label: "Fechado" },
  { code: "archived", label: "Arquivado" },
] as const;

export type ClusterStatusCode = (typeof clusterStatusOptions)[number]["code"];

export const clusterScopeLabels = {
  conditions: "Condições de trabalho",
  economic: "Pauta econômica",
  mixed: "Misto",
  undefined: "Sem classificação",
} as const;

export type ClusterScope = keyof typeof clusterScopeLabels;

export function labelClusterStatus(status: ClusterStatusCode) {
  return clusterStatusOptions.find((option) => option.code === status)?.label ?? status;
}

export function labelClusterScope(scope: ClusterScope) {
  return clusterScopeLabels[scope];
}

export type ClusterFormActionState = {
  error?: string;
};

export type ClusterLinkActionState = {
  error?: string;
};
