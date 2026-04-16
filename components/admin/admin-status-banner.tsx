type AdminStatusBannerProps = {
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
    message: "Verifique os campos obrigatórios e tente novamente.",
  },
  "nome-invalido": {
    kind: "error",
    message: "Informe um nome válido.",
  },
  "slug-duplicado": {
    kind: "error",
    message: "Já existe um cadastro com este código ou slug.",
  },
  "cluster-salvo": {
    kind: "success",
    message: "Cluster salvo com sucesso.",
  },
  "vinculo-salvo": {
    kind: "success",
    message: "Vínculo criado com sucesso.",
  },
  "vinculo-removido": {
    kind: "success",
    message: "Vínculo removido com sucesso.",
  },
  "vinculo-ja-existente": {
    kind: "error",
    message: "Este item já está vinculado ao cluster.",
  },
  "cluster-ja-existente": {
    kind: "error",
    message: "Já existe um cluster com esses dados.",
  },
  "sem-permissao": {
    kind: "error",
    message: "Você não tem acesso administrativo a este cadastro.",
  },
  erro: {
    kind: "error",
    message: "Não foi possível salvar a alteração agora.",
  },
  salvo: {
    kind: "success",
    message: "Cadastro salvo com sucesso.",
  },
  arquivada: {
    kind: "success",
    message: "Empresa arquivada com sucesso.",
  },
  reativada: {
    kind: "success",
    message: "Cadastro reativado com sucesso.",
  },
  desativado: {
    kind: "success",
    message: "Cadastro desativado com sucesso.",
  },
};

export function AdminStatusBanner({ status }: AdminStatusBannerProps) {
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

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${base}`}>{entry.message}</div>
  );
}
