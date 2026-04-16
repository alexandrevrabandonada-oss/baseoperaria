"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type NucleosDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NucleosDetailError({ error, reset }: NucleosDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Falha ao carregar núcleo</h2>
        <p className="text-sm text-muted-foreground">
          Tente novamente. Se o problema persistir, volte à listagem.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
