"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { toggleMyNucleusMembershipAction } from "@/app/nucleos/actions";
import { Button } from "@/components/ui/button";
import type { NucleusMemberActionState } from "@/types/nucleos";

type NucleusMembershipToggleFormProps = {
  companyId: string;
  isMember: boolean;
  nucleusId: string;
  returnTo: string;
};

function SubmitButton({ isMember }: { isMember: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={isMember ? "outline" : "default"} className="w-full" disabled={pending}>
      {pending ? "Processando..." : isMember ? "Sair do núcleo" : "Entrar no núcleo"}
    </Button>
  );
}

export function NucleusMembershipToggleForm({
  companyId,
  isMember,
  nucleusId,
  returnTo,
}: NucleusMembershipToggleFormProps) {
  const [state, formAction] = useActionState<NucleusMemberActionState, FormData>(
    toggleMyNucleusMembershipAction,
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
      <input type="hidden" name="nucleus_id" value={nucleusId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <SubmitButton isMember={isMember} />
    </form>
  );
}
