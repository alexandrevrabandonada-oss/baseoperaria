import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminSectionItems } from "@/types/admin";
import { getAdminAccessContext } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const context = await getAdminAccessContext();

  if (!context.user) {
    redirect("/entrar");
  }

  if (context.companies.length === 0) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Administração</p>
          <h1 className="text-3xl font-semibold tracking-tight">Cadastros de apoio</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Área restrita para manter a base organizacional do piloto com uma interface simples e
            móvel.
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Empresas administrativas
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.companies.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acesso
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Só owner/admin entra aqui. Moderador usa a área de moderação e trabalhador comum
            permanece na área principal.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ordem recomendada
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Empresa, unidades, setores, turnos, categorias e clusters.
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {adminSectionItems.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className="rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex h-full flex-col gap-2">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Empresas disponíveis</p>
        <div className="grid gap-3">
          {context.companies.map((company) => (
            <article key={company.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold">{company.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {company.role} · {company.slug}
                  </p>
                </div>
                <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                  {company.archivedAt ? "Arquivada" : "Ativa"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AdminEmptyState
        title="Sequência prática"
        description="Comece por Empresas, depois crie Unidades, Setores, Turnos e Categorias para liberar o uso dos formulários do app."
      />
    </div>
  );
}
