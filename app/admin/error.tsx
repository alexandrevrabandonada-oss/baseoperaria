"use client";

import { Button } from "@/components/ui/button";

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
        <div className="flex flex-col gap-1">
          <p className="font-medium">Não foi possível abrir a área administrativa.</p>
          <p className="text-destructive/80">Tente de novo. Se continuar travando, revise acesso e estado da base.</p>
        </div>
        <p className="text-destructive/80">{error.message}</p>
        <Button type="button" onClick={reset} variant="outline" className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
