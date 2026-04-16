type PagePlaceholderProps = {
  title: string;
};

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[calc(100dvh-11rem)] flex-col justify-start rounded-xl border border-dashed border-border bg-card px-5 py-6 sm:min-h-[20rem] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6">
        <div className="w-fit rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary">
          Infraestrutura operária
        </div>

        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <h1 className="max-w-3xl text-4xl font-bold uppercase tracking-[0.05em] text-foreground sm:text-5xl">
            Base Operária
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Captação de relatos, leitura coletiva, pauta e organização interna com linguagem direta,
            estrutura rígida e presença popular.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/90 bg-background/60 px-4 py-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/85">Relatos</p>
            <p className="mt-2 text-sm text-muted-foreground">Captura rápida do que está acontecendo no chão de trabalho.</p>
          </div>
          <div className="rounded-lg border border-border/90 bg-background/60 px-4 py-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/85">Pautas</p>
            <p className="mt-2 text-sm text-muted-foreground">Transformação do sinal bruto em demanda organizada e pressionável.</p>
          </div>
          <div className="rounded-lg border border-border/90 bg-background/60 px-4 py-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/85">Núcleos</p>
            <p className="mt-2 text-sm text-muted-foreground">Coordenação por base, tema e encaminhamento prático.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
