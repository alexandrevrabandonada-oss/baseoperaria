export default function AdminClustersLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-32 animate-pulse rounded-3xl border bg-muted/40" />
      <div className="h-40 animate-pulse rounded-2xl border bg-muted/40" />
      <div className="h-64 animate-pulse rounded-2xl border bg-muted/40" />
    </div>
  );
}
