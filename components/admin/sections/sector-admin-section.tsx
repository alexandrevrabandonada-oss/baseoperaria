import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import { saveSectorAction, toggleSectorActiveAction } from "@/app/admin/actions";
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

type SectorAdminSectionProps = {
  companyId: string | undefined;
  editId: string | undefined;
  status: string | undefined;
};

export async function SectorAdminSection({ companyId, editId, status }: SectorAdminSectionProps) {
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.userId) {
    return null;
  }

  if (workspace.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Tenha administração em uma empresa para começar a organizar os setores da base."
      />
    );
  }

  if (!workspace.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={workspace.companies}
          selectedCompanyId={workspace.selectedCompanyId}
          targetPath="/admin/setores"
        />
        <AdminEmptyState
          title="Escolha uma empresa"
          description="Os setores ficam presos a uma empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [sectorsResult, unitsResult] = await Promise.all([
    supabase
      .from("sectors")
      .select("id, name, code, description, active, unit_id, company_id")
      .eq("company_id", workspace.selectedCompany.id)
      .order("name", { ascending: true }),
    supabase
      .from("units")
      .select("id, name")
      .eq("company_id", workspace.selectedCompany.id)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const sectors = sectorsResult.data ?? [];
  const units = unitsResult.data ?? [];
  const editingSector = isUuid(editId) ? sectors.find((sector) => sector.id === editId) ?? null : null;
  const returnTo = `/admin/setores?company_id=${workspace.selectedCompany.id}`;
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name] as const));

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Setores</p>
          <h1 className="text-3xl font-semibold tracking-tight">Setores para ler o problema com precisão</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Os setores ajudam a localizar o problema sem inflar a estrutura com cadastro demais.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <CompanyChips
        companies={workspace.companies}
        selectedCompanyId={workspace.selectedCompany.id}
        targetPath="/admin/setores"
      />

      <section className="rounded-2xl border bg-card p-4">
        <form action={saveSectorAction} className="flex flex-col gap-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
          <input type="hidden" name="sector_id" value={editingSector?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome do setor
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={editingSector?.name ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Ex.: Expedição"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Código
              <input
                type="text"
                name="code"
                maxLength={80}
                defaultValue={editingSector?.code ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Gerado automaticamente se ficar vazio"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Unidade vinculada
            <select
              name="unit_id"
              defaultValue={editingSector?.unit_id ?? ""}
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

          <label className="flex flex-col gap-2 text-sm font-medium">
            Descrição curta
            <textarea
              name="description"
              maxLength={240}
              rows={3}
              defaultValue={editingSector?.description ?? ""}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Resumo curto de como esse setor aparece na base"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants())}>
              {editingSector ? "Registrar ajuste no setor" : "Abrir setor"}
            </button>
            {editingSector ? (
              <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Setores cadastrados</p>
        <div className="grid gap-3">
          {sectors.length > 0 ? (
            sectors.map((sector) => {
              const active = sector.active;
              return (
                <article key={sector.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold">{sector.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {sector.code}
                          {sector.unit_id ? ` · ${unitMap.get(sector.unit_id) ?? "Sem recorte de unidade"}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        {active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {sector.description ? (
                      <p className="text-sm text-muted-foreground">{sector.description}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${returnTo}&edit=${sector.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Ajustar
                      </Link>

                      <form action={toggleSectorActiveAction}>
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
                        <input type="hidden" name="sector_id" value={sector.id} />
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
              title="Nenhum setor cadastrado"
              description="Abra o primeiro setor para localizar melhor relato, pauta e registro econômico."
              actionHref={returnTo}
              actionLabel="Abrir setor"
            />
          )}
        </div>
      </section>
    </div>
  );
}
