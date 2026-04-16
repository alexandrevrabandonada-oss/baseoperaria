import Link from "next/link";

import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import type { PautaListContext } from "@/lib/supabase/pautas";
import { labelPautaStatus } from "@/types/pautas";
import { cn } from "@/lib/utils";
import { PautasEmptyState } from "@/components/pautas/pautas-empty-state";
import { PautasStatusBanner } from "@/components/pautas/pautas-status-banner";

type PautasListViewProps = {
  context: PautaListContext;
  status: string | undefined;
};

function statusLabel(status: string) {
  return labelPautaStatus(status as Parameters<typeof labelPautaStatus>[0]);
}

export function PautasListView({ context, status }: PautasListViewProps) {
  if (context.companies.length === 0) {
    return (
      <PautasEmptyState
        title="Nenhuma empresa disponível"
        description="Você precisa estar ligado a uma empresa para enxergar as pautas da base."
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
          targetPath="/pautas"
        />
        <PautasEmptyState
          title="Escolha uma empresa"
          description="As pautas são separadas por empresa. Escolha uma acima para seguir."
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="surface-hero">
        <div className="flex flex-col gap-3">
          <p className="section-label">Pautas</p>
          <h1 className="section-title">Pautas que saem do problema e ganham forma</h1>
          <p className="section-copy">
            Aqui o acúmulo vira pauta com prioridade, situação e apoio de quem faz parte da base.
          </p>
        </div>
      </section>

      <PautasStatusBanner status={status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompany.id}
        targetPath="/pautas"
      />

      <section className="surface-subtle">
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            A pauta nasce do cluster. Quem está na base acompanha, lê e apoia sem perder o foco no que precisa ser enfrentado.
          </p>
          {context.selectedCompany.role === "owner" || context.selectedCompany.role === "admin" ? (
            <Link
              href={`/admin/clusters?company_id=${context.selectedCompany.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Abrir clusters
            </Link>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="section-label">Pautas cadastradas</p>
        {context.demands.length === 0 ? (
          <PautasEmptyState
            title="Nenhuma pauta ainda"
            description="Quando um problema agrupado virar pauta, ele aparece aqui para leitura e apoio."
          />
        ) : (
          <div className="grid gap-3">
            {context.demands.map((demand) => (
              <article key={demand.id} className="surface-panel p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-base font-semibold">{demand.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {demand.kindLabel} · {demand.priorityLabel ?? "Sem prioridade definida"}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {statusLabel(demand.status)}
                    </span>
                  </div>

                  {demand.description ? (
                    <p className="text-sm leading-6 text-muted-foreground">{demand.description}</p>
                  ) : null}

                  <div className="meta-grid">
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Apoios
                      </p>
                      <p className="mt-1 text-lg font-semibold">{demand.supportCount}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Unidade
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.unitName ?? "Sem recorte de unidade"}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Setor
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.sectorName ?? "Sem recorte de setor"}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cluster
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.clusterTitle ?? "Sem cluster ligado"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={demand.href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver pauta
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
