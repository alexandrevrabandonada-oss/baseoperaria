"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type PautasErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PautasError({ error, reset }: PautasErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Não foi possível puxar as pautas</h2>
        <p className="text-sm text-muted-foreground">
          Tente de novo. Se continuar travando, recarregue a base e abra a lista outra vez.
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
