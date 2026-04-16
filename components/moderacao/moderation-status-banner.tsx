type ModerationStatusBannerProps = {
  status: string | undefined;
};

const statusMessages: Record<
  string,
  {
    kind: "error" | "success" | "info";
    message: string;
  }
> = {
  "dados-invalidos": {
    kind: "error",
    message: "Confira os campos obrigatórios e tente novamente.",
  },
  "sem-permissao": {
    kind: "error",
    message: "Você não tem permissão para executar esta ação.",
  },
  "vinculo-salvo": {
    kind: "success",
    message: "Item vinculado ao cluster com sucesso.",
  },
  "relato-sinalizado": {
    kind: "success",
    message: "Relato sinalizado com sucesso.",
  },
  "relato-arquivado": {
    kind: "success",
    message: "Relato arquivado com sucesso.",
  },
  "economico-sinalizado": {
    kind: "success",
    message: "Registro econômico sinalizado com sucesso.",
  },
  "economico-arquivado": {
    kind: "success",
    message: "Registro econômico arquivado com sucesso.",
  },
  "anexo-sinalizado": {
    kind: "success",
    message: "Anexo sinalizado com sucesso.",
  },
  erro: {
    kind: "error",
    message: "Não foi possível concluir a ação agora.",
  },
};

export function ModerationStatusBanner({ status }: ModerationStatusBannerProps) {
  if (!status) {
    return null;
  }

  const entry = statusMessages[status];

  if (!entry) {
    return null;
  }

  const base =
    entry.kind === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : entry.kind === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "border-border bg-muted text-foreground";

  return <div className={`rounded-xl border px-4 py-3 text-sm ${base}`}>{entry.message}</div>;
}
