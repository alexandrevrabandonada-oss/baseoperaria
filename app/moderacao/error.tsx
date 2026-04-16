"use client";

type ModeracaoErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ModeracaoError({ error, reset }: ModeracaoErrorProps) {
  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Não foi possível carregar a moderação</h1>
          <p className="text-sm">
            Tente novamente. Se o erro persistir, volte para a área principal.
          </p>
        </div>

        <pre className="whitespace-pre-wrap text-xs text-destructive/80">{error.message}</pre>

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 px-4 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
