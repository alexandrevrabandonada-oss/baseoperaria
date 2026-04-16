const statusMessages: Record<string, { description: string; title: string }> = {
  confirmado: {
    description: "Sua confirmação foi registrada.",
    title: "Confirmação salva",
  },
  criado: {
    description: "O registro econômico foi salvo com sucesso.",
    title: "Registro criado",
  },
  "criado-com-alerta": {
    description: "O registro foi salvo, mas parte dos anexos não pôde ser processada.",
    title: "Registro salvo com alerta",
  },
  "sem-empresa": {
    description: "Você precisa estar vinculado a uma empresa para continuar.",
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

  return (
    <section className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-medium">{message.title}</p>
      <p className="text-sm text-muted-foreground">{message.description}</p>
    </section>
  );
}
