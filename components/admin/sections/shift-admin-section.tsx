import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import { saveShiftAction, toggleShiftActiveAction } from "@/app/admin/actions";
import { getAdminWorkspaceContext } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

type ShiftAdminSectionProps = {
  companyId: string | undefined;
  editId: string | undefined;
  status: string | undefined;
};

export async function ShiftAdminSection({ companyId, editId, status }: ShiftAdminSectionProps) {
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.userId) {
    return null;
  }

  if (workspace.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Tenha administração em uma empresa para começar a organizar os turnos da base."
      />
    );
  }

  if (!workspace.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={workspace.companies}
          selectedCompanyId={workspace.selectedCompanyId}
          targetPath="/admin/turnos"
        />
        <AdminEmptyState
          title="Escolha uma empresa"
          description="Os turnos ficam presos a uma empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [shiftsResult, unitsResult] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, name, code, active, unit_id, start_time, end_time, overnight, company_id")
      .eq("company_id", workspace.selectedCompany.id)
      .order("name", { ascending: true }),
    supabase
      .from("units")
      .select("id, name")
      .eq("company_id", workspace.selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const shifts = shiftsResult.data ?? [];
  const units = unitsResult.data ?? [];
  const editingShift = isUuid(editId) ? shifts.find((shift) => shift.id === editId) ?? null : null;
  const returnTo = `/admin/turnos?company_id=${workspace.selectedCompany.id}`;
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name] as const));

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Turnos</p>
          <h1 className="text-3xl font-semibold tracking-tight">Turnos para marcar onde o problema aperta</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Defina os turnos com horário e virada de dia para que a leitura da base fique concreta.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <CompanyChips
        companies={workspace.companies}
        selectedCompanyId={workspace.selectedCompany.id}
        targetPath="/admin/turnos"
      />

      <section className="rounded-2xl border bg-card p-4">
        <form action={saveShiftAction} className="flex flex-col gap-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
          <input type="hidden" name="shift_id" value={editingShift?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome do turno
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={editingShift?.name ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Ex.: Primeiro turno"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Código
              <input
                type="text"
                name="code"
                maxLength={80}
                defaultValue={editingShift?.code ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Gerado automaticamente se ficar vazio"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Início
              <input
                type="time"
                name="start_time"
                defaultValue={editingShift?.start_time?.slice(0, 5) ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Fim
              <input
                type="time"
                name="end_time"
                defaultValue={editingShift?.end_time?.slice(0, 5) ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Unidade vinculada
              <select
                name="unit_id"
                defaultValue={editingShift?.unit_id ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Sem recorte de unidade</option>
                {workspace.unitOptions.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-row items-start gap-3 rounded-lg border border-input bg-background px-3 py-3 text-sm font-medium">
            <input
              type="checkbox"
              name="overnight"
              defaultChecked={editingShift?.overnight ?? false}
              className="mt-1 size-4 rounded border-input"
            />
            <span className="flex flex-col gap-1">
              Virada de dia
              <span className="text-xs font-normal text-muted-foreground">
                Marque quando o turno atravessa a meia-noite.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants())}>
              {editingShift ? "Registrar ajuste no turno" : "Abrir turno"}
            </button>
            {editingShift ? (
              <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Turnos cadastrados</p>
        <div className="grid gap-3">
          {shifts.length > 0 ? (
            shifts.map((shift) => {
              const active = shift.active;
              return (
                <article key={shift.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold">{shift.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {shift.code}
                          {shift.unit_id ? ` · ${unitMap.get(shift.unit_id) ?? "Sem recorte de unidade"}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        {active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {shift.start_time ?? "--:--"} até {shift.end_time ?? "--:--"}
                      {shift.overnight ? " · vira o dia" : ""}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${returnTo}&edit=${shift.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Ajustar
                      </Link>

                      <form action={toggleShiftActiveAction}>
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
                        <input type="hidden" name="shift_id" value={shift.id} />
                        <input
                          type="hidden"
                          name="next_active"
                          value={active ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          {active ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <AdminEmptyState
              title="Nenhum turno cadastrado"
              description="Abra o primeiro turno para marcar melhor onde o problema se repete."
              actionHref={returnTo}
              actionLabel="Abrir turno"
            />
          )}
        </div>
      </section>
    </div>
  );
}
