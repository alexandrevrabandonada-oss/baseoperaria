"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type NucleosErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NucleosError({ error, reset }: NucleosErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Não foi possível puxar os núcleos</h2>
        <p className="text-sm text-muted-foreground">
          Tente de novo. Se continuar travando, recarregue a base e volte para a listagem.
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
