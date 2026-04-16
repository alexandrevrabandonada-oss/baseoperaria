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
      {pending ? "Enviando..." : "Salvar relato"}
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

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Empresa selecionada
        </p>
        <h2 className="mt-1 text-base font-semibold">{companyName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Os campos abaixo são o recorte mínimo para um relato de condições de trabalho.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Unidade"
          name="unit_id"
          options={unitOptions}
          placeholder="Sem unidade"
        />
        <SelectField
          label="Setor"
          name="sector_id"
          options={sectorOptions}
          placeholder="Sem setor"
        />
        <SelectField
          label="Turno"
          name="shift_id"
          options={shiftOptions}
          placeholder="Sem turno"
        />
        <SelectField
          label="Categoria"
          name="category_id"
          options={categoryOptions}
          placeholder="Selecione uma categoria"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LookupField
          label="Gravidade"
          name="severity_code"
          options={severityOptions}
          placeholder="Selecione a gravidade"
        />
        <LookupField
          label="Frequência"
          name="frequency_code"
          options={frequencyOptions}
          placeholder="Selecione a frequência"
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
          placeholder="Resumo curto do problema"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Descrição curta
        <textarea
          name="description"
          maxLength={240}
          rows={4}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Explique o essencial sem expor dados desnecessários."
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
          PDFs e imagens são suficientes para a maioria dos casos. Se não houver anexo, siga sem ele.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
