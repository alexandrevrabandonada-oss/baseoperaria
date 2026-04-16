export default function PautasLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-28 rounded-3xl border bg-card p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl border bg-card" />
        <div className="h-24 animate-pulse rounded-2xl border bg-card" />
        <div className="h-24 animate-pulse rounded-2xl border bg-card" />
      </div>
    </div>
  );
}
