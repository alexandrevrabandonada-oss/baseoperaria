"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
      <div className="flex flex-col gap-3">
        <p className="font-medium">Falha ao carregar a área administrativa.</p>
        <p>{error.message}</p>
        <button type="button" onClick={reset} className="w-fit underline underline-offset-4">
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
