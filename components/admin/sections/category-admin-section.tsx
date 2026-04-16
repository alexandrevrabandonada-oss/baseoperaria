import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import { saveCategoryAction, toggleCategoryActiveAction } from "@/app/admin/actions";
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

type CategoryAdminSectionProps = {
  companyId: string | undefined;
  editId: string | undefined;
  status: string | undefined;
};

export async function CategoryAdminSection({
  companyId,
  editId,
  status,
}: CategoryAdminSectionProps) {
  const workspace = await getAdminWorkspaceContext(companyId);

  if (!workspace.userId) {
    return null;
  }

  if (workspace.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Tenha administração em uma empresa para começar a organizar as categorias da base."
      />
    );
  }

  if (!workspace.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={workspace.companies}
          selectedCompanyId={workspace.selectedCompanyId}
          targetPath="/admin/categorias"
        />
        <AdminEmptyState
          title="Escolha uma empresa"
          description="As categorias ficam presas a uma empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("report_categories")
    .select("id, name, code, description, active, category_kind, company_id")
    .eq("company_id", workspace.selectedCompany.id)
    .order("name", { ascending: true });

  const editingCategory = isUuid(editId)
    ? (categories ?? []).find((category) => category.id === editId) ?? null
    : null;
  const returnTo = `/admin/categorias?company_id=${workspace.selectedCompany.id}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Categorias de relato</p>
          <h1 className="text-3xl font-semibold tracking-tight">Categorias para nomear o problema</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Separe condição de trabalho e pauta econômica sem transformar a base em burocracia.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <CompanyChips
        companies={workspace.companies}
        selectedCompanyId={workspace.selectedCompany.id}
        targetPath="/admin/categorias"
      />

      <section className="rounded-2xl border bg-card p-4">
        <form action={saveCategoryAction} className="flex flex-col gap-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
          <input type="hidden" name="category_id" value={editingCategory?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome da categoria
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={editingCategory?.name ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Ex.: Segurança"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Código
              <input
                type="text"
                name="code"
                maxLength={80}
                defaultValue={editingCategory?.code ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Gerado automaticamente se ficar vazio"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Tipo de categoria
            <select
              name="category_kind"
              defaultValue={editingCategory?.category_kind ?? "conditions"}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="conditions">Condições de trabalho</option>
              <option value="economic">Pauta econômica</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Descrição curta
            <textarea
              name="description"
              maxLength={240}
              rows={3}
              defaultValue={editingCategory?.description ?? ""}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Resumo curto para orientar quem vai registrar"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants())}>
              {editingCategory ? "Registrar ajuste na categoria" : "Abrir categoria"}
            </button>
            {editingCategory ? (
              <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Categorias cadastradas</p>
        <div className="grid gap-3">
          {categories && categories.length > 0 ? (
            categories.map((category) => {
              const active = category.active;
              return (
                <article key={category.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold">{category.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {category.code} ·{" "}
                          {category.category_kind === "conditions" ? "Condições de trabalho" : "Pauta econômica"}
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        {active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {category.description ? (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${returnTo}&edit=${category.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Ajustar
                      </Link>

                      <form action={toggleCategoryActiveAction}>
                        <input type="hidden" name="return_to" value={returnTo} />
                        <input type="hidden" name="company_id" value={workspace.selectedCompany.id} />
                        <input type="hidden" name="category_id" value={category.id} />
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
              title="Nenhuma categoria cadastrada"
              description="Abra a primeira categoria para dar nome ao que vai ser registrado na base."
              actionHref={returnTo}
              actionLabel="Abrir categoria"
            />
          )}
        </div>
      </section>
    </div>
  );
}
