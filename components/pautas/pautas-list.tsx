import Link from "next/link";

import { CompanyChips } from "@/components/relatos/company-chips";
import { buttonVariants } from "@/components/ui/button";
import type { PautaListContext } from "@/lib/supabase/pautas";
import { pautaStatusOptions } from "@/types/pautas";
import { cn } from "@/lib/utils";
import { PautasEmptyState } from "@/components/pautas/pautas-empty-state";
import { PautasStatusBanner } from "@/components/pautas/pautas-status-banner";

type PautasListViewProps = {
  context: PautaListContext;
  status: string | undefined;
};

function statusLabel(status: string) {
  return pautaStatusOptions.find((option) => option.code === status)?.label ?? status;
}

export function PautasListView({ context, status }: PautasListViewProps) {
  if (context.companies.length === 0) {
    return (
      <PautasEmptyState
        title="Nenhuma empresa disponível"
        description="Você precisa estar vinculado a uma empresa para ver pautas."
        href="/onboarding"
        actionLabel="Voltar ao onboarding"
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
          description="As pautas são organizadas por empresa. Selecione uma acima para continuar."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Pautas</p>
          <h1 className="text-3xl font-semibold tracking-tight">Agenda prática do coletivo</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            As pautas consolidam clusters em uma peça objetiva, com tipo, prioridade, status e
            apoio simples de membros autenticados.
          </p>
        </div>
      </section>

      <PautasStatusBanner status={status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompany.id}
        targetPath="/pautas"
      />

      <section className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Moderadores criam pautas a partir dos clusters na área administrativa. O fluxo do
            trabalhador comum fica apenas para leitura e apoio.
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
        <p className="text-sm font-medium text-muted-foreground">Pautas cadastradas</p>
        {context.demands.length === 0 ? (
          <PautasEmptyState
            title="Nenhuma pauta ainda"
            description="Quando um moderador transformar um cluster em pauta, ela aparecerá aqui."
          />
        ) : (
          <div className="grid gap-3">
            {context.demands.map((demand) => (
              <article key={demand.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-base font-semibold">{demand.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {demand.kindLabel} · {demand.priorityLabel ?? "Sem prioridade"}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {statusLabel(demand.status)}
                    </span>
                  </div>

                  {demand.description ? (
                    <p className="text-sm leading-6 text-muted-foreground">{demand.description}</p>
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Apoios
                      </p>
                      <p className="mt-1 text-lg font-semibold">{demand.supportCount}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Unidade
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.unitName ?? "Sem unidade"}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Setor
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.sectorName ?? "Sem setor"}</p>
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cluster
                      </p>
                      <p className="mt-1 text-sm font-semibold">{demand.clusterTitle ?? "Sem cluster"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={demand.href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Abrir
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
