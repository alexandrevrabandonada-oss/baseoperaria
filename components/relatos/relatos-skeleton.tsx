export function RelatosSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-32 animate-pulse rounded-2xl border bg-muted/40" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
        <div className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
      </div>
    </div>
  );
}
