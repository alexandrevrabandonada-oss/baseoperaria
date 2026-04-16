"use client";

import { Button } from "@/components/ui/button";

type ModeracaoErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ModeracaoError({ error, reset }: ModeracaoErrorProps) {
  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Não foi possível abrir a moderação</h1>
          <p className="text-sm">
            Tente de novo. Se continuar travando, volte para a base e entre outra vez por aqui.
          </p>
        </div>

        <pre className="whitespace-pre-wrap text-xs text-destructive/80">{error.message}</pre>

        <Button type="button" onClick={reset} variant="outline" className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
