type RadarEmptyStateProps = {
  description: string;
  title: string;
};

export function RadarEmptyState({ description, title }: RadarEmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
