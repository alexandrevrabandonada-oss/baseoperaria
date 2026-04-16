import { StatusBanner } from "@/components/ui/status-banner";

type RelatosStatusBannerProps = {
  status?: string | undefined;
};

const statusCopy: Record<
  string,
  {
    kind: "error" | "info" | "success" | "warning";
    message: string;
    title: string;
  }
> = {
  confirmado: {
    kind: "success",
    message: "Sua confirmação foi registrada.",
    title: "Confirmação salva",
  },
  criado: {
    kind: "success",
    message: "Relato criado com sucesso.",
    title: "Relato criado",
  },
  "criado-com-alerta": {
    kind: "warning",
    message: "Relato criado, mas alguns anexos falharam no envio. Você pode tentar de novo depois.",
    title: "Relato salvo com alerta",
  },
  erro: {
    kind: "error",
    message: "Não foi possível concluir a operação agora.",
    title: "Falha no relato",
  },
  "sem-empresa": {
    kind: "info",
    message: "Você ainda não está vinculado a nenhuma empresa para criar relatos.",
    title: "Sem empresa vinculada",
  },
  "sem-relatos": {
    kind: "info",
    message: "Nenhum relato encontrado.",
    title: "Sem relatos",
  },
  "sem-vinculo": {
    kind: "info",
    message: "Seu acesso ainda não foi associado a uma empresa. Aguarde o vínculo ou fale com a administração.",
    title: "Vínculo pendente",
  },
};

export function RelatosStatusBanner({ status }: RelatosStatusBannerProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  const entry = statusCopy[status];

  return <StatusBanner kind={entry.kind} message={entry.message} title={entry.title} />;
}
