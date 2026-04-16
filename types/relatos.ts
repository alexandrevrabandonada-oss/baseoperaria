export const reportConfirmationOptions = [
  {
    code: "acontece_tambem",
    label: "Acontece também",
  },
  {
    code: "acontece_direto",
    label: "Acontece direto",
  },
  {
    code: "tenho_prova",
    label: "Tenho prova",
  },
  {
    code: "urgente",
    label: "Urgente",
  },
] as const;

export type ReportConfirmationType =
  (typeof reportConfirmationOptions)[number]["code"];

export type ReportFormActionState = {
  error?: string;
};

export type ReportConfirmationActionState = {
  error?: string;
};
