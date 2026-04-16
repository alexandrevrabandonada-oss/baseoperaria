import Link from "next/link";

import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import type { NucleusListContext } from "@/lib/supabase/nucleos";
import { cn } from "@/lib/utils";
import { NucleosEmptyState } from "@/components/nucleos/nucleos-empty-state";
import { NucleosStatusBanner } from "@/components/nucleos/nucleos-status-banner";

type NucleosListViewProps = {
  context: NucleusListContext;
  status: string | undefined;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NucleosListView({ context, status }: NucleosListViewProps) {
  if (context.companies.length === 0) {
    return (
      <NucleosEmptyState
        title="Nenhuma empresa disponível"
        description="Você precisa estar ligado a uma empresa para enxergar os núcleos da base."
        href="/onboarding"
        actionLabel="Fechar cadastro"
      />
    );
  }

  if (!context.selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <CompanyChips
          companies={context.companies}
          selectedCompanyId={context.selectedCompanyId}
          targetPath="/nucleos"
        />
        <NucleosEmptyState
          title="Escolha uma empresa"
          description="Os núcleos são separados por empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  const canManage = context.selectedCompany.role === "owner" || context.selectedCompany.role === "admin";
  const totalMembers = context.nuclei.reduce((sum, nucleus) => sum + nucleus.memberCount, 0);
  const totalLinkedDemands = context.nuclei.reduce((sum, nucleus) => sum + nucleus.linkedDemandCount, 0);
  const totalActions = context.nuclei.reduce((sum, nucleus) => sum + nucleus.actionCount, 0);
  const emptyStateProps = canManage
    ? {
        actionLabel: "Criar núcleo",
        href: `/nucleos/novo?company_id=${context.selectedCompany.id}`,
      }
    : {};

  return (
    <div className="page-stack">
      <section className="surface-hero">
        <div className="flex flex-col gap-3">
          <p className="section-label">Núcleos</p>
          <h1 className="section-title">Organização de base ligada à pauta</h1>
          <p className="section-copy">
            Núcleos juntam gente por setor ou tema para tocar pauta, encaminhamento e ação sem virar rede social.
          </p>
        </div>
      </section>

      <NucleosStatusBanner status={status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompany.id}
        targetPath="/nucleos"
      />

      <section className="metric-grid">
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Núcleos
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.nuclei.length}</p>
        </div>
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Membros
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalMembers}</p>
        </div>
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pautas ligadas
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalLinkedDemands}</p>
        </div>
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Encaminhamentos
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalActions}</p>
        </div>
      </section>

      <section className="surface-subtle">
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {canManage
              ? "Quem organiza a base pode abrir núcleos por setor ou tema e puxar o trabalho dali."
              : "Você pode entrar ou sair dos núcleos liberados para sua empresa."}
          </p>
          {canManage ? (
            <Link
              href={`/nucleos/novo?company_id=${context.selectedCompany.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Abrir núcleo
            </Link>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="section-label">Núcleos cadastrados</p>
        {context.nuclei.length === 0 ? (
          <NucleosEmptyState
            title="Nenhum núcleo ainda"
            description={
              canManage
                ? "Quando o primeiro núcleo for aberto, ele aparece aqui com membros, pautas e encaminhamentos."
                : "Quando um núcleo for aberto para sua empresa, ele aparece aqui."
            }
            {...emptyStateProps}
          />
        ) : (
          <div className="grid gap-3">
            {context.nuclei.map((nucleus) => (
              <article key={nucleus.id} className="surface-panel p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-base font-semibold">{nucleus.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {nucleus.scopeLabel} · {nucleus.statusLabel}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {nucleus.memberCount} membros
                    </span>
                  </div>

                  {nucleus.description ? (
                    <p className="text-sm leading-6 text-muted-foreground">{nucleus.description}</p>
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">Sem resumo registrado.</p>
                  )}

                  <div className="meta-grid">
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Pautas ligadas
                      </p>
                      <p className="mt-1 text-lg font-semibold">{nucleus.linkedDemandCount}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Encaminhamentos
                      </p>
                      <p className="mt-1 text-lg font-semibold">{nucleus.actionCount}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Membros
                      </p>
                      <p className="mt-1 text-lg font-semibold">{nucleus.memberCount}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Atualizado
                      </p>
                      <p className="mt-1 text-sm font-semibold">{formatDate(nucleus.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={nucleus.href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver núcleo
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
