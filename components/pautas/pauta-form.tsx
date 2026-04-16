"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { saveDemandAction } from "@/app/pautas/actions";
import { Button } from "@/components/ui/button";
import type { PautaCreateContext } from "@/lib/supabase/pautas";
import { pautaKindOptions, pautaStatusOptions } from "@/types/pautas";
import type { PautaFormActionState } from "@/types/pautas";

type PautaFormProps = {
  context: PautaCreateContext;
  returnTo: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Salvando..." : "Criar pauta"}
    </Button>
  );
}

function SelectField({
  label,
  name,
  options,
  placeholder,
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  options: Array<{ id: string; label: string }>;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PautaForm({ context, returnTo }: PautaFormProps) {
  const [state, formAction] = useActionState<PautaFormActionState, FormData>(saveDemandAction, {});
  const kindOptions = pautaKindOptions.map((option) => ({ id: option.code, label: option.label }));
  const statusOptions = pautaStatusOptions.map((option) => ({
    id: option.code,
    label: option.label,
  }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="cluster_id" value={context.cluster.id} />
      <input type="hidden" name="company_id" value={context.companyId} />

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Origem do cluster
        </p>
        <h2 className="mt-1 text-base font-semibold">{context.cluster.title}</h2>
        {context.cluster.summary ? (
          <p className="mt-2 text-sm text-muted-foreground">{context.cluster.summary}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sem descrição do cluster.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          Título
          <input
            type="text"
            name="title"
            required
            minLength={2}
            maxLength={120}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Título objetivo da pauta"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          Texto objetivo
          <textarea
            name="description"
            required
            maxLength={240}
            rows={4}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Descreva a pauta de forma curta e direta."
          />
        </label>

        <SelectField
          label="Tipo"
          name="kind"
          options={kindOptions}
          placeholder="Selecione o tipo"
          required
          defaultValue={context.defaultKind}
        />

        <SelectField
          label="Prioridade"
          name="priority_code"
          options={context.severityOptions.map((option) => ({ id: option.code, label: option.label }))}
          placeholder="Selecione a prioridade"
          required
        />

        <SelectField
          label="Status"
          name="status"
          options={statusOptions}
          placeholder="Selecione o status"
          required
          defaultValue="open"
        />

        <SelectField
          label="Unidade"
          name="unit_id"
          options={context.unitOptions}
          placeholder="Sem unidade"
        />

        <SelectField
          label="Setor"
          name="sector_id"
          options={context.sectorOptions}
          placeholder="Sem setor"
        />
      </div>

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          A pauta nasce do cluster selecionado e permanece objetiva: sem comentários livres, sem
          votação complexa e sem feed social.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
