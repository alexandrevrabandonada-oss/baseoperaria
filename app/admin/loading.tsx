export default function AdminLoading() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Abrindo a área restrita</p>
        <p className="text-sm text-muted-foreground">Aguarde enquanto a base administrativa é puxada.</p>
      </div>
    </section>
  );
}
