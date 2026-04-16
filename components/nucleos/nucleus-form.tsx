"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveNucleusAction } from "@/app/nucleos/actions";
import { Button } from "@/components/ui/button";
import type { NucleusCreateContext } from "@/lib/supabase/nucleos";
import { nucleusScopeOptions } from "@/types/nucleos";
import type { NucleusFormActionState, NucleusScope } from "@/types/nucleos";

type NucleusFormProps = {
  context: NucleusCreateContext;
  returnTo: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Abrindo..." : "Abrir núcleo"}
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

export function NucleusForm({ context, returnTo }: NucleusFormProps) {
  const [state, formAction] = useActionState<NucleusFormActionState, FormData>(saveNucleusAction, {});
  const [scopeKind, setScopeKind] = useState(context.defaultScopeKind);
  const scopeOptions = nucleusScopeOptions.map((option) => ({ id: option.code, label: option.label }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="company_id" value={context.companyId} />

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Empresa selecionada
        </p>
        <h2 className="mt-1 text-base font-semibold">{context.companyName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Núcleos juntam gente por setor ou tema para tocar pauta sem virar feed ou conversa solta.
        </p>
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
            placeholder="Nome curto para identificar esse núcleo"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
          Descrição
          <textarea
            name="description"
            required
            maxLength={240}
            rows={4}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Explique em uma frase o que esse núcleo vai organizar."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Escopo
          <select
            name="scope_kind"
            value={scopeKind}
            onChange={(event) => setScopeKind(event.target.value as NucleusScope)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {scopeOptions.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={option.id === "sector" && context.sectorOptions.length === 0}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {scopeKind === "sector" ? (
          <SelectField
            label="Setor"
            name="sector_id"
            options={context.sectorOptions}
            placeholder={context.sectorOptions.length > 0 ? "Escolha o setor" : "Sem setor ativo para usar"}
            required={context.sectorOptions.length > 0}
            defaultValue=""
          />
        ) : (
          <label className="flex flex-col gap-2 text-sm font-medium">
            Tema
            <input
              type="text"
              name="theme"
              maxLength={120}
              required
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Tema que organiza esse núcleo"
            />
          </label>
        )}
      </div>

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Use setor quando a base estiver organizada por área fixa. Use tema quando o problema atravessar mais de um setor.
        </p>
      </section>

      <SubmitButton />
    </form>
  );
}
