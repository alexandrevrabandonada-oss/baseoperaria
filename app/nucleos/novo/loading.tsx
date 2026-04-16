export default function NucleosNovoLoading() {
  return (
    <section className="flex min-h-[calc(100dvh-11rem)] flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="h-5 w-20 rounded bg-muted" />
      <div className="h-10 w-2/3 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-12 rounded-lg bg-muted/60" />
        <div className="h-12 rounded-lg bg-muted/60" />
        <div className="h-28 rounded-lg bg-muted/60 md:col-span-2" />
      </div>
      <div className="h-16 rounded-2xl bg-muted/60" />
      <div className="h-11 rounded-lg bg-muted/60" />
    </section>
  );
}
