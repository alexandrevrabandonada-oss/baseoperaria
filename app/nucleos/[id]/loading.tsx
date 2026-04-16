export default function NucleosDetalheLoading() {
  return (
    <section className="flex min-h-[calc(100dvh-11rem)] flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="h-5 w-24 rounded bg-muted" />
      <div className="h-10 w-2/3 rounded bg-muted" />
      <div className="h-4 w-full max-w-2xl rounded bg-muted" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-20 rounded-xl bg-muted/60" />
        <div className="h-20 rounded-xl bg-muted/60" />
        <div className="h-20 rounded-xl bg-muted/60" />
        <div className="h-20 rounded-xl bg-muted/60" />
      </div>
      <div className="h-44 rounded-2xl bg-muted/60" />
      <div className="h-44 rounded-2xl bg-muted/60" />
    </section>
  );
}
