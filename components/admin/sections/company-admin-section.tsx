import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { buttonVariants } from "@/components/ui/button";
import { saveCompanyAction, toggleCompanyArchiveAction } from "@/app/admin/actions";
import { getAdminAccessContext } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

type CompanyAdminSectionProps = {
  editId: string | undefined;
  status: string | undefined;
};

export async function CompanyAdminSection({ editId, status }: CompanyAdminSectionProps) {
  const context = await getAdminAccessContext();

  if (!context.user) {
    return null;
  }

  if (context.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Você precisa ter administração em uma empresa para mexer nessa frente da base."
      />
    );
  }

  const editingCompany = isUuid(editId)
    ? context.companies.find((company) => company.id === editId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Empresas</p>
          <h1 className="text-3xl font-semibold tracking-tight">Base das empresas no sistema</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Aqui você abre e ajusta as empresas que delimitam acesso, leitura e organização da base.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <section className="rounded-2xl border bg-card p-4">
        <form action={saveCompanyAction} className="flex flex-col gap-4">
          <input type="hidden" name="return_to" value="/admin/empresas" />
          <input type="hidden" name="company_id" value={editingCompany?.id ?? ""} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome da empresa
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={editingCompany?.name ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Ex.: Fábrica Piloto"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Slug do sistema
              <input
                type="text"
                name="slug"
                maxLength={80}
                defaultValue={editingCompany?.slug ?? ""}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Gerado automaticamente se ficar vazio"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Website ou referência pública
            <input
              type="text"
              name="website"
              maxLength={240}
              defaultValue={editingCompany?.website ?? ""}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Se houver referência pública, registre aqui"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            Descrição curta
            <textarea
              name="description"
              maxLength={240}
              rows={3}
              defaultValue={editingCompany?.description ?? ""}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Resumo curto do papel dessa empresa na base"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants())}>
              {editingCompany ? "Registrar ajuste na empresa" : "Abrir empresa"}
            </button>
            {editingCompany ? (
              <Link href="/admin/empresas" className={cn(buttonVariants({ variant: "outline" }))}>
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Empresas cadastradas</p>
        <div className="grid gap-3">
          {context.companies.map((company) => {
            const archived = Boolean(company.archivedAt);

            return (
              <article key={company.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-base font-semibold">{company.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        <code className="rounded bg-muted px-1 py-0.5">{company.slug}</code> ·{" "}
                        {company.role}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {archived ? "Arquivada" : "Ativa"}
                    </span>
                  </div>

                  {company.id === editingCompany?.id ? (
                    <p className="text-xs text-muted-foreground">
                      Você está ajustando essa empresa agora.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/empresas?edit=${company.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ajustar
                    </Link>

                    <form action={toggleCompanyArchiveAction}>
                      <input type="hidden" name="return_to" value="/admin/empresas" />
                      <input type="hidden" name="company_id" value={company.id} />
                      <input
                        type="hidden"
                        name="next_archived"
                        value={archived ? "false" : "true"}
                      />
                      <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        {archived ? "Reativar" : "Arquivar"}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
