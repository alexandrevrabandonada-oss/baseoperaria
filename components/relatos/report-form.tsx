"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createReportAction } from "@/app/relatos/actions";
import { Button } from "@/components/ui/button";
import type { LookupRow } from "@/lib/supabase/types";
import type { RelatosFormContext } from "@/lib/supabase/relatos";
import type { ReportFormActionState } from "@/types/relatos";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Registrando..." : "Registrar relato"}
    </Button>
  );
}

type ReportFormProps = Pick<
  RelatosFormContext,
  | "categoryOptions"
  | "frequencyOptions"
  | "sectorOptions"
  | "severityOptions"
  | "shiftOptions"
  | "unitOptions"
> & {
  companyId: string;
  companyName: string;
};

function SelectField({
  label,
  name,
  options,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  options: Array<{ id: string; label: string }>;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue=""
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

function LookupField({
  label,
  name,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  options: LookupRow[];
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue=""
        required
        className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ReportForm({
  categoryOptions,
  companyId,
  companyName,
  frequencyOptions,
  sectorOptions,
  severityOptions,
  shiftOptions,
  unitOptions,
}: ReportFormProps) {
  const [state, formAction] = useActionState<
    ReportFormActionState,
    FormData
  >(createReportAction, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-5">
      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="company_id" value={companyId} />

      <section className="surface-subtle">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Empresa selecionada
        </p>
        <h2 className="mt-1 text-base font-semibold">{companyName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Os campos abaixo seguram o mínimo para registrar problema, contexto e prova.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        <SelectField
          label="Unidade"
          name="unit_id"
          options={unitOptions}
          placeholder="Sem recorte de unidade"
        />
        <SelectField
          label="Setor"
          name="sector_id"
          options={sectorOptions}
          placeholder="Sem recorte de setor"
        />
        <SelectField
          label="Turno"
          name="shift_id"
          options={shiftOptions}
          placeholder="Sem recorte de turno"
        />
        <SelectField
          label="Categoria"
          name="category_id"
          options={categoryOptions}
          placeholder="Escolha a categoria do problema"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        <LookupField
          label="Gravidade"
          name="severity_code"
          options={severityOptions}
          placeholder="Escolha o peso do problema"
        />
        <LookupField
          label="Frequência"
          name="frequency_code"
          options={frequencyOptions}
          placeholder="Escolha o quanto isso se repete"
        />
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Título
        <input
          type="text"
          name="title"
          required
          maxLength={90}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Resumo curto do que está acontecendo"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Descrição curta
        <textarea
          name="description"
          maxLength={240}
          rows={4}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Explique o essencial do problema sem expor mais do que precisa."
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Anexos opcionais
        <input
          type="file"
          name="attachments"
          multiple
          accept=".pdf,image/*"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <span className="text-xs text-muted-foreground">
          PDF e imagem já bastam na maioria dos casos. Se não houver prova agora, siga sem anexo.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
