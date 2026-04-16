type PagePlaceholderProps = {
  title: string;
};

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[calc(100dvh-11rem)] flex-col justify-start rounded-2xl border border-dashed border-border bg-card px-5 py-6 sm:min-h-[20rem] sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Página inicial vazia.</p>
      </header>
    </section>
  );
}
