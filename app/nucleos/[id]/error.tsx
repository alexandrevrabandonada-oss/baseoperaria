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
        <h2 className="text-lg font-semibold tracking-tight">Não foi possível puxar este núcleo</h2>
        <p className="text-sm text-muted-foreground">
          Tente de novo. Se continuar travando, volte à listagem e abra o núcleo outra vez.
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
