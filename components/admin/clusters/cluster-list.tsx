import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { ClusterForm } from "@/components/admin/clusters/cluster-form";
import { buttonVariants } from "@/components/ui/button";
import { CompanyChips } from "@/components/relatos/company-chips";
import type { ClusterListContext } from "@/lib/supabase/clusters";
import { labelClusterStatus } from "@/types/clusters";
import { cn } from "@/lib/utils";

type ClusterListViewProps = {
  context: ClusterListContext;
  status: string | undefined;
};

function statusLabel(status: string) {
  return labelClusterStatus(status as Parameters<typeof labelClusterStatus>[0]);
}

export function ClusterListView({ context, status }: ClusterListViewProps) {
  if (context.companies.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhuma empresa administrativa"
        description="Você precisa ter administração em uma empresa para usar a área de clusters."
      />
    );
  }

  if (!context.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={context.companies}
          selectedCompanyId={context.selectedCompanyId}
          targetPath="/admin/clusters"
        />
        <AdminEmptyState
          title="Escolha uma empresa"
          description="Os clusters ficam presos a uma empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  const returnTo = `/admin/clusters?company_id=${context.selectedCompany.id}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Clusters</p>
          <h1 className="text-3xl font-semibold tracking-tight">Agrupar sinais antes da pauta</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada cluster junta condição de trabalho e pauta econômica quando o acúmulo aponta a mesma frente. O agrupamento é manual.
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompany.id}
        targetPath="/admin/clusters"
      />

      <section className="rounded-2xl border bg-card p-4">
        <ClusterForm
          categories={context.categories}
          companyId={context.selectedCompany.id}
          companyName={context.selectedCompany.name}
          description="Use este formulário para abrir um cluster sem dividir o acúmulo entre condições de trabalho e pauta econômica."
          returnTo={returnTo}
          submitLabel="Criar cluster"
          title="Novo cluster"
        />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Clusters cadastrados</p>
        {context.clusters.length === 0 ? (
          <AdminEmptyState
            title="Nenhum cluster ainda"
            description="Abra o primeiro cluster acima para começar a juntar relato e pauta econômica no mesmo acúmulo."
          />
        ) : (
          <div className="grid gap-3">
            {context.clusters.map((cluster) => (
              <article key={cluster.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-base font-semibold">{cluster.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {cluster.categoryLabel ?? "Sem categoria marcada"} · {cluster.scopeLabel}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {statusLabel(cluster.status)}
                    </span>
                  </div>

                  {cluster.summary ? (
                    <p className="text-sm leading-6 text-muted-foreground">{cluster.summary}</p>
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">Sem resumo registrado.</p>
                  )}

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Relatos
                      </p>
                      <p className="mt-1 text-lg font-semibold">{cluster.reportLinkCount}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Econômicos
                      </p>
                      <p className="mt-1 text-lg font-semibold">{cluster.economicLinkCount}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Totais
                      </p>
                      <p className="mt-1 text-lg font-semibold">{cluster.linkCount}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/clusters/${cluster.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver cluster
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
