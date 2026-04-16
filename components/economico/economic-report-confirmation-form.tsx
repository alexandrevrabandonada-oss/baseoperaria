"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { confirmEconomicReportAction } from "@/app/economico/actions";
import { Button } from "@/components/ui/button";
import { reportConfirmationOptions, type ReportConfirmationType } from "@/types/relatos";
import type { EconomicReportConfirmationActionState } from "@/types/economico";

function ConfirmationButton({
  code,
  label,
}: {
  code: ReportConfirmationType;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="confirmation_type_code"
      value={code}
      variant="outline"
      className="justify-start"
      disabled={pending}
    >
      {label}
    </Button>
  );
}

type EconomicReportConfirmationFormProps = {
  isCreator: boolean;
  myConfirmation: ReportConfirmationType | null;
  reportId: string;
};

export function EconomicReportConfirmationForm({
  isCreator,
  myConfirmation,
  reportId,
}: EconomicReportConfirmationFormProps) {
  const [state, formAction] = useActionState<
    EconomicReportConfirmationActionState,
    FormData
  >(confirmEconomicReportAction, {});

  if (isCreator) {
    return (
      <div className="rounded-2xl border bg-muted p-4 text-sm text-muted-foreground">
        O autor do registro não confirma o próprio registro. Outros usuários autenticados podem
        confirmar este item.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="economic_report_id" value={reportId} />

      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {myConfirmation ? (
        <div className="rounded-2xl border bg-muted p-4 text-sm text-muted-foreground">
          Sua confirmação atual:{" "}
          <span className="font-medium text-foreground">
            {reportConfirmationOptions.find((option) => option.code === myConfirmation)?.label ??
              myConfirmation}
          </span>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {reportConfirmationOptions.map((option) => (
          <ConfirmationButton key={option.code} code={option.code} label={option.label} />
        ))}
      </div>
    </form>
  );
}
