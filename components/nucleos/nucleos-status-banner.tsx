import { StatusBanner } from "@/components/ui/status-banner";

type NucleosStatusBannerProps = {
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
  "sem-nucleo": {
    kind: "error",
    message: "Escolha um núcleo válido para continuar.",
  },
  "nucleo-salvo": {
    kind: "success",
    message: "Núcleo criado com sucesso.",
  },
  "membro-salvo": {
    kind: "success",
    message: "Adesão registrada com sucesso.",
  },
  "membro-removido": {
    kind: "success",
    message: "Saída do núcleo registrada com sucesso.",
  },
  "acao-salva": {
    kind: "success",
    message: "Encaminhamento registrado com sucesso.",
  },
  erro: {
    kind: "error",
    message: "Não foi possível concluir a operação agora.",
  },
};

export function NucleosStatusBanner({ status }: NucleosStatusBannerProps) {
  if (!status) {
    return null;
  }

  const entry = statusMessages[status];
  if (!entry) {
    return null;
  }

  return <StatusBanner kind={entry.kind} message={entry.message} />;
}
