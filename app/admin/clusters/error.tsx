"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type AdminClustersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminClustersError({ error, reset }: AdminClustersErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Erro</p>
        <h1 className="text-2xl font-semibold tracking-tight">Não foi possível abrir os clusters</h1>
        <p className="text-sm text-muted-foreground">
          Tente de novo. Se continuar travando, confira a base e as permissões de quem está entrando.
        </p>
      </div>
      <Button type="button" onClick={() => reset()} className="w-full sm:w-auto">
        Tentar novamente
      </Button>
    </div>
  );
}
