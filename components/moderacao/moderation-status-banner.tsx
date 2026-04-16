import { StatusBanner } from "@/components/ui/status-banner";

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
    message: "Item ligado ao cluster com sucesso.",
  },
  "relato-sinalizado": {
    kind: "success",
    message: "Relato marcado com sucesso.",
  },
  "relato-arquivado": {
    kind: "success",
    message: "Relato arquivado com sucesso.",
  },
  "economico-sinalizado": {
    kind: "success",
    message: "Registro econômico marcado com sucesso.",
  },
  "economico-arquivado": {
    kind: "success",
    message: "Registro econômico arquivado com sucesso.",
  },
  "anexo-sinalizado": {
    kind: "success",
    message: "Anexo marcado com sucesso.",
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

  return <StatusBanner kind={entry.kind} message={entry.message} />;
}
