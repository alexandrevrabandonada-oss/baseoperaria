"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { saveNucleusMemberAction } from "@/app/nucleos/actions";
import { Button } from "@/components/ui/button";
import type { NucleusCompanyMemberOption } from "@/lib/supabase/nucleos";
import { nucleusMemberRoleOptions } from "@/types/nucleos";
import type { NucleusMemberActionState } from "@/types/nucleos";

type NucleusMemberFormProps = {
  companyId: string;
  nucleusId: string;
  memberOptions: NucleusCompanyMemberOption[];
  returnTo: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Salvando..." : "Adicionar membro"}
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

export function NucleusMemberForm({
  companyId,
  nucleusId,
  memberOptions,
  returnTo,
}: NucleusMemberFormProps) {
  const [state, formAction] = useActionState<NucleusMemberActionState, FormData>(
    saveNucleusMemberAction,
    {},
  );
  const roleOptions = nucleusMemberRoleOptions.map((option) => ({
    id: option.code,
    label: option.label,
  }));

  if (memberOptions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro disponível para vincular.</p>;
  }

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
        <SelectField
          label="Membro"
          name="profile_id"
          options={memberOptions}
          placeholder="Selecione um membro"
          required
        />
        <SelectField
          label="Papel"
          name="role"
          options={roleOptions}
          placeholder="Selecione o papel"
          required
          defaultValue="member"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
