export const economicIssueTypeOptions = [
  { code: "salario_baixo", label: "Salário baixo" },
  { code: "equiparacao", label: "Equiparação salarial" },
  { code: "desvio_de_funcao", label: "Desvio de função" },
  { code: "hora_extra_nao_paga", label: "Hora extra não paga" },
  { code: "adicional_nao_pago", label: "Adicional não pago" },
  { code: "atraso_pagamento", label: "Atraso de pagamento" },
  { code: "desconto_indevido", label: "Desconto indevido" },
  { code: "beneficio_cortado", label: "Benefício cortado" },
  { code: "beneficio_desigual", label: "Benefício desigual" },
  { code: "plr_injusta", label: "PLR injusta" },
  { code: "terceirizacao_desigual", label: "Terceirização desigual" },
] as const;

export type EconomicIssueTypeCode =
  (typeof economicIssueTypeOptions)[number]["code"];

export type EconomicReportFormActionState = {
  error?: string;
};

export type EconomicReportConfirmationActionState = {
  error?: string;
};
