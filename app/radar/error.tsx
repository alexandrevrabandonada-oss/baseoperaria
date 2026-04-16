"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type RadarErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RadarError({ error, reset }: RadarErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-2xl border border-destructive/20 bg-card p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-destructive">Radar indisponível</p>
          <h1 className="text-2xl font-semibold tracking-tight">Falha ao carregar a leitura</h1>
          <p className="text-sm text-muted-foreground">
            Tente novamente. Se o problema persistir, revise a conexão com o Supabase e a sessão
            atual.
          </p>
        </div>

        <Button type="button" onClick={reset} className="w-fit">
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
