export default function AdminSectionLoading() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Carregando cadastro</p>
        <p className="text-sm text-muted-foreground">Aguarde enquanto os dados da seção são buscados.</p>
      </div>
    </section>
  );
}
