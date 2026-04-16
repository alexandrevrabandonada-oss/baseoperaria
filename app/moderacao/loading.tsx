export default function ModeracaoLoading() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Abrindo a moderação</p>
        <p className="text-sm text-muted-foreground">
          Aguarde enquanto relatos, anexos e registros em revisão são puxados.
        </p>
      </div>
    </section>
  );
}
