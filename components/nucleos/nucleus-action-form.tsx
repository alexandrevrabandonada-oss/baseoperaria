"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { saveNucleusEncaminhamentoAction } from "@/app/nucleos/actions";
import { Button } from "@/components/ui/button";
import { nucleusActionStatusOptions, nucleusActionTypeOptions } from "@/types/nucleos";
import type { NucleusActionState } from "@/types/nucleos";

type NucleusActionFormProps = {
  companyId: string;
  demandOptions: Array<{ id: string; label: string; meta: string | null }>;
  nucleusId: string;
  returnTo: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Registrando..." : "Registrar encaminhamento"}
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

export function NucleusActionForm({
  companyId,
  demandOptions,
  nucleusId,
  returnTo,
}: NucleusActionFormProps) {
  const [state, formAction] = useActionState<NucleusActionState, FormData>(
    saveNucleusEncaminhamentoAction,
    {},
  );
  const actionTypeOptions = nucleusActionTypeOptions.map((option) => ({
    id: option.code,
    label: option.label,
  }));
  const statusOptions = nucleusActionStatusOptions.map((option) => ({
    id: option.code,
    label: option.label,
  }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="nucleus_id" value={nucleusId} />
      <input type="hidden" name="return_to" value={returnTo} />

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
            placeholder="Resumo curto do que precisa ser feito"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          Detalhes
          <textarea
            name="details"
            maxLength={240}
            rows={3}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Informação objetiva para registrar a ação desse núcleo."
          />
        </label>

        <SelectField
          label="Tipo"
          name="action_type"
          options={actionTypeOptions}
          placeholder="Escolha o tipo de ação"
          required
          defaultValue="other"
        />

        <SelectField
          label="Status"
          name="status"
          options={statusOptions}
          placeholder="Escolha a situação da ação"
          required
          defaultValue="planned"
        />

        <SelectField
          label="Pauta vinculada"
          name="demand_id"
          options={demandOptions}
          placeholder="Sem pauta ligada"
        />
      </div>

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          O encaminhamento fica restrito ao núcleo e pode puxar uma pauta já existente sem abrir conversa paralela.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
