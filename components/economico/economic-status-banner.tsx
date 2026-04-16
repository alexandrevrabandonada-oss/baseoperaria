import { StatusBanner } from "@/components/ui/status-banner";

const statusMessages: Record<
  string,
  {
    description: string;
    kind: "error" | "info" | "success" | "warning";
    title: string;
  }
> = {
  confirmado: {
    description: "Sua confirmação foi registrada.",
    kind: "success",
    title: "Confirmação salva",
  },
  criado: {
    description: "O registro da pauta econômica foi salvo com sucesso.",
    kind: "success",
    title: "Registro criado",
  },
  "criado-com-alerta": {
    description: "O registro foi salvo, mas parte dos anexos não pôde ser processada.",
    kind: "warning",
    title: "Registro salvo com alerta",
  },
  "sem-empresa": {
    description: "Você precisa estar vinculado a uma empresa para continuar.",
    kind: "info",
    title: "Sem empresa vinculada",
  },
};

type EconomicStatusBannerProps = {
  status?: string | undefined;
};

export function EconomicStatusBanner({ status }: EconomicStatusBannerProps) {
  if (!status || !statusMessages[status]) {
    return null;
  }

  const message = statusMessages[status];

  return <StatusBanner kind={message.kind} message={message.description} title={message.title} />;
}
