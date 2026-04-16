import { StatusBanner } from "@/components/ui/status-banner";

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
    message: "Revise os campos obrigatórios e tente de novo.",
  },
  "nome-invalido": {
    kind: "error",
    message: "Informe um nome válido.",
  },
  "slug-duplicado": {
    kind: "error",
    message: "Já existe cadastro com esse código ou slug.",
  },
  "cluster-salvo": {
    kind: "success",
    message: "Cluster registrado com sucesso.",
  },
  "vinculo-salvo": {
    kind: "success",
    message: "Ligação registrada com sucesso.",
  },
  "vinculo-removido": {
    kind: "success",
    message: "Ligação removida com sucesso.",
  },
  "vinculo-ja-existente": {
    kind: "error",
    message: "Este item já está ligado a esse cluster.",
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
    message: "Não conseguimos registrar essa alteração agora.",
  },
  salvo: {
    kind: "success",
    message: "Cadastro registrado com sucesso.",
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

  return <StatusBanner kind={entry.kind} message={entry.message} />;
}
