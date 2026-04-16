import { StatusBanner } from "@/components/ui/status-banner";

type RadarStatusBannerProps = {
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
  erro: {
    kind: "error",
    message: "Não conseguimos abrir o radar agora.",
    title: "Falha no radar",
  },
  "sem-dados": {
    kind: "info",
    message: "Ainda não há acúmulo suficiente para montar leitura nesse recorte.",
    title: "Sem base consolidada",
  },
  "sem-empresa": {
    kind: "info",
    message: "Escolha uma empresa para abrir essa leitura da base.",
    title: "Selecione a empresa",
  },
};

export function RadarStatusBanner({ status }: RadarStatusBannerProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  const entry = statusCopy[status];

  return <StatusBanner kind={entry.kind} message={entry.message} title={entry.title} />;
}
