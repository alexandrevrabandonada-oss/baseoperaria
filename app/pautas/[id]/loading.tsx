export default function PautaDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-32 animate-pulse rounded-3xl border bg-card" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-24 animate-pulse rounded-2xl border bg-card" />
        <div className="h-24 animate-pulse rounded-2xl border bg-card" />
      </div>
    </div>
  );
}
