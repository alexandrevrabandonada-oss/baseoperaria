export function EconomicSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-32 rounded-3xl border bg-card/70" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl border bg-card/70" />
        <div className="h-24 rounded-2xl border bg-card/70" />
      </div>
      <div className="h-28 rounded-2xl border bg-card/70" />
      <div className="h-28 rounded-2xl border bg-card/70" />
    </div>
  );
}
