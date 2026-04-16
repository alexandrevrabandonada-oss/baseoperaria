import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import { saveUnitAction, toggleUnitActiveAction } from "@/app/admin/actions";
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

type UnitAdminSectionProps = {
  editId: string | undefined;
  companyId: string | undefined;
  status: string | undefined;
};

export async function UnitAdminSection({ companyId, editId, status }: UnitAdminSectionProps) {
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.userId) {
    return null;
  }

  if (workspace.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Cadastre ou vincule uma empresa como owner/admin para começar a organizar unidades."
      />
    );
  }

  if (!workspace.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={workspace.companies}
          selectedCompanyId={workspace.selectedCompanyId}
          targetPath="/admin/unidades"
        />
        <AdminEmptyState
          title="Escolha uma empresa"
          description="As unidades ficam vinculadas a uma empresa. Selecione uma acima para continuar."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: units } = await supabase
    .from("units")
    .select("id, name, code, description, active, company_id")
    .eq("company_id", workspace.selectedCompany.id)
    .order("name", { ascending: true });

  const editingUnit = isUuid(editId)
    ? (units ?? []).find((unit) => unit.id === editId) ?? null
    : null;
  const returnTo = `/admin/unidades?company_id=${workspace.selectedCompany.id}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Unidades</p>
          <h1 className="text-3xl font-semibold tracking-tight">Base operacional da empresa</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Cadastre unidades simples e mantenha o fluxo enxuto para o piloto.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <CompanyChips
        companies={workspace.companies}
        selectedCompanyId={workspace.selectedCompany.id}
        targetPath="/admin/unidades"
      />

      <section className="rounded-2xl border bg-card p-4">
        <form action={saveUnitAction} className="flex flex-col gap-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
          <input type="hidden" name="unit_id" value={editingUnit?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome da unidade
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={editingUnit?.name ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Ex.: Unidade Central"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Código
              <input
                type="text"
                name="code"
                maxLength={80}
                defaultValue={editingUnit?.code ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Opcional; gerado se vazio"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Descrição curta
            <textarea
              name="description"
              maxLength={240}
              rows={3}
              defaultValue={editingUnit?.description ?? ""}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Opcional"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants())}>
              {editingUnit ? "Salvar unidade" : "Criar unidade"}
            </button>
            {editingUnit ? (
              <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Unidades cadastradas</p>
        <div className="grid gap-3">
          {(units ?? []).length > 0 ? (
            (units ?? []).map((unit) => {
              const active = unit.active;
              return (
                <article key={unit.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold">{unit.name}</h2>
                        <p className="text-xs text-muted-foreground">{unit.code}</p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        {active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {unit.description ? (
                      <p className="text-sm text-muted-foreground">{unit.description}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${returnTo}&edit=${unit.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Editar
                      </Link>

                      <form action={toggleUnitActiveAction}>
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
                        <input type="hidden" name="unit_id" value={unit.id} />
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
              title="Nenhuma unidade cadastrada"
              description="Crie a primeira unidade para organizar relatos e registros."
              actionHref={returnTo}
              actionLabel="Criar unidade"
            />
          )}
        </div>
      </section>
    </div>
  );
}
