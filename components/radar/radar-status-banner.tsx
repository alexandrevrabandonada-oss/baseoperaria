type RadarStatusBannerProps = {
  status?: string | undefined;
};

const statusCopy: Record<string, string> = {
  erro: "Não foi possível carregar o radar agora.",
  "sem-dados": "Ainda não há sinais suficientes para montar um radar útil neste recorte.",
  "sem-empresa": "Selecione uma empresa para ler o radar coletivo.",
};

export function RadarStatusBanner({ status }: RadarStatusBannerProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
      {statusCopy[status]}
    </div>
  );
}
