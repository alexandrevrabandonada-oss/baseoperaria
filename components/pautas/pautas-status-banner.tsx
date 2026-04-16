import { StatusBanner } from "@/components/ui/status-banner";

type PautasStatusBannerProps = {
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
  "sem-permissao": {
    kind: "error",
    message: "Você não tem permissão para executar esta ação.",
  },
  "sem-cluster": {
    kind: "error",
    message: "Selecione um cluster de origem para criar a pauta.",
  },
  "pauta-salva": {
    kind: "success",
    message: "Pauta criada com sucesso.",
  },
  "apoio-salvo": {
    kind: "success",
    message: "Seu apoio foi registrado.",
  },
  "apoio-removido": {
    kind: "success",
    message: "Seu apoio foi removido.",
  },
  erro: {
    kind: "error",
    message: "Não foi possível concluir a operação agora.",
  },
};

export function PautasStatusBanner({ status }: PautasStatusBannerProps) {
  if (!status) {
    return null;
  }

  const entry = statusMessages[status];

  if (!entry) {
    return null;
  }

  return <StatusBanner kind={entry.kind} message={entry.message} />;
}
