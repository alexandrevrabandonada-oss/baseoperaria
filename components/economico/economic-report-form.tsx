"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createEconomicReportAction } from "@/app/economico/actions";
import { Button } from "@/components/ui/button";
import type { LookupRow } from "@/lib/supabase/types";
import type { EconomicFormContext } from "@/lib/supabase/economico";
import type { EconomicReportFormActionState } from "@/types/economico";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Registrando..." : "Abrir registro econômico"}
    </Button>
  );
}

type EconomicReportFormProps = Pick<
  EconomicFormContext,
  | "contractTypeOptions"
  | "issueTypeOptions"
  | "salaryBandOptions"
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
  placeholder,
  required = false,
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

export function EconomicReportForm({
  companyId,
  companyName,
  contractTypeOptions,
  issueTypeOptions,
  salaryBandOptions,
  sectorOptions,
  severityOptions,
  shiftOptions,
  unitOptions,
}: EconomicReportFormProps) {
  const [state, formAction] = useActionState<
    EconomicReportFormActionState,
    FormData
  >(createEconomicReportAction, {});

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
          Aqui o registro usa faixa salarial, não valor exato, para proteger quem informa.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        <SelectField label="Unidade" name="unit_id" options={unitOptions} placeholder="Sem recorte de unidade" />
        <SelectField label="Setor" name="sector_id" options={sectorOptions} placeholder="Sem recorte de setor" />
        <SelectField label="Turno" name="shift_id" options={shiftOptions} placeholder="Sem recorte de turno" />
        <LookupField
          label="Tipo de vínculo"
          name="contract_type_code"
          options={contractTypeOptions}
          placeholder="Escolha seu tipo de vínculo"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        <LookupField
          label="Faixa salarial"
          name="salary_band_code"
          options={salaryBandOptions}
          placeholder="Escolha a faixa salarial"
        />
        <LookupField
          label="Tipo de pauta econômica"
          name="issue_type_code"
          options={issueTypeOptions}
          placeholder="Escolha a frente econômica"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Cargo na carteira
          <input
            type="text"
            name="formal_role"
            required
            maxLength={90}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Como seu cargo aparece formalmente"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          O que você faz de verdade
          <input
            type="text"
            name="real_function"
            required
            maxLength={90}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Qual função você realmente cumpre"
          />
        </label>
      </div>

      <LookupField
        label="Gravidade"
        name="severity_code"
        options={severityOptions}
        placeholder="Escolha o peso do problema"
      />

      <label className="flex flex-col gap-2 text-sm font-medium">
        Descrição curta
        <textarea
          name="description"
          required
          maxLength={260}
          rows={4}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Explique o problema sem informar valor exato."
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Anexo opcional
        <input
          type="file"
          name="attachments"
          multiple
          accept=".pdf,image/*"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <span className="text-xs text-muted-foreground">
          PDF e imagem já bastam. Se não houver prova agora, siga sem anexo.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
