"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { toggleDemandSupportAction } from "@/app/pautas/actions";
import { Button } from "@/components/ui/button";
import type { PautaSupportActionState } from "@/types/pautas";

type PautaSupportFormProps = {
  companyId: string;
  demandId: string;
  isSupportedByMe: boolean;
  returnTo: string;
};

function SubmitButton({ isSupportedByMe }: { isSupportedByMe: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={isSupportedByMe ? "outline" : "default"} className="w-full" disabled={pending}>
      {pending ? "Processando..." : isSupportedByMe ? "Retirar apoio" : "Apoiar pauta"}
    </Button>
  );
}

export function PautaSupportForm({
  companyId,
  demandId,
  isSupportedByMe,
  returnTo,
}: PautaSupportFormProps) {
  const [state, formAction] = useActionState<PautaSupportActionState, FormData>(
    toggleDemandSupportAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="demand_id" value={demandId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <SubmitButton isSupportedByMe={isSupportedByMe} />
    </form>
  );
}
