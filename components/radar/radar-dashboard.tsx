import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { RadarContext } from "@/lib/supabase/radar";
import { cn } from "@/lib/utils";

import { RadarEmptyState } from "@/components/radar/radar-empty-state";
import { RadarStatusBanner } from "@/components/radar/radar-status-banner";

type RadarDashboardProps = {
  context: RadarContext;
  status: string | undefined;
};

function SectionCard({
  description,
  items,
  title,
}: {
  description: string;
  items: Array<{ count: number; label: string }>;
  title: string;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há força suficiente nesse recorte.</p>
        ) : (
          <div className="grid gap-2">
            {items.slice(0, 5).map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function RadarDashboard({ context, status }: RadarDashboardProps) {
  const selectedCompany = context.selectedCompany;
  const companyCount = context.companies.length;

  if (!selectedCompany) {
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border bg-card p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Radar</p>
              <h1 className="text-3xl font-semibold tracking-tight">Leitura privada do que está se repetindo</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                O radar junta relatos, frente econômica, clusters e pautas para mostrar onde o problema está apertando mais.
              </p>
            </div>

            {companyCount > 1 ? (
              <div className="flex flex-wrap gap-2">
                {context.companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/radar?company_id=${company.id}`}
                    className={cn(
                      buttonVariants({
                        variant: context.selectedCompanyId === company.id ? "default" : "outline",
                        size: "sm",
                      }),
                    )}
                  >
                    {company.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <RadarStatusBanner status={status ?? (companyCount > 0 ? "sem-empresa" : "sem-dados")} />

        <RadarEmptyState
          title={companyCount > 0 ? "Selecione uma empresa" : "Sem empresa vinculada"}
          description={
            companyCount > 0
              ? "Escolha a empresa que você quer ler. O radar só abre o que está dentro do seu acesso."
              : "Sem empresa ligada ao seu acesso, não existe base para montar esse radar."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Radar</p>
            <h1 className="text-3xl font-semibold tracking-tight">Leitura privada do que está se repetindo</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Leitura montada a partir do que já foi registrado em {selectedCompany.name}. O foco é enxergar repetição, peso e prioridade.
            </p>
          </div>

          {companyCount > 1 ? (
            <div className="flex flex-wrap gap-2">
              {context.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/radar?company_id=${company.id}`}
                  className={cn(
                    buttonVariants({
                      variant: context.selectedCompanyId === company.id ? "default" : "outline",
                      size: "sm",
                    }),
                  )}
                >
                  {company.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <RadarStatusBanner status={status} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {context.summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Categorias"
          description="Problemas que mais aparecem dentro desse recorte da base."
          items={context.categoryBreakdown}
        />
        <SectionCard
          title="Setores"
          description="Setores onde os sinais estão apertando mais."
          items={context.sectorBreakdown}
        />
        <SectionCard
          title="Turnos"
          description="Como o problema se distribui entre os turnos."
          items={context.shiftBreakdown}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Frentes econômicas"
          description="Problemas do bolso e do vínculo que mais voltam nesse recorte."
          items={context.economicIssueBreakdown}
        />
        <SectionCard
          title="Faixas salariais"
          description="Leitura por faixa salarial, sem expor valor exato."
          items={context.economicSalaryBreakdown}
        />
        <SectionCard
          title="Vínculos"
          description="Distribuição por tipo de vínculo de trabalho."
          items={context.economicContractBreakdown}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">Clusters mais relevantes</h2>
              <p className="text-sm text-muted-foreground">
                Ordenados pelo volume de sinais já agrupados manualmente.
              </p>
            </div>

            {context.topClusters.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há cluster com força suficiente aqui.</p>
            ) : (
              <div className="grid gap-3">
                {context.topClusters.map((cluster) => (
                  <article key={cluster.id} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-1 font-medium">
                          {cluster.scopeLabel}
                        </span>
                        <span className="rounded-full border px-2 py-1 font-medium">
                          {cluster.statusLabel}
                        </span>
                        <span>{cluster.totalLinkCount} vínculos</span>
                      </div>
                      <h3 className="text-sm font-semibold">{cluster.title}</h3>
                      {cluster.summary ? (
                        <p className="text-sm text-muted-foreground">{cluster.summary}</p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">Pautas prioritárias</h2>
              <p className="text-sm text-muted-foreground">
                Pautas mais apertadas neste momento, com apoio já registrado.
              </p>
            </div>

            {context.priorityDemands.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há pauta prioritária puxando a fila.</p>
            ) : (
              <div className="grid gap-3">
                {context.priorityDemands.map((demand) => (
                  <article key={demand.id} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-1 font-medium">
                          {demand.kindLabel}
                        </span>
                        <span className="rounded-full border px-2 py-1 font-medium">
                          {demand.statusLabel}
                        </span>
                        <span>{demand.supportCount} apoios</span>
                      </div>
                      <h3 className="text-sm font-semibold">{demand.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {demand.priorityLabel ? `Prioridade: ${demand.priorityLabel}` : "Sem prioridade fechada"}
                        {demand.clusterTitle ? ` · Origem: ${demand.clusterTitle}` : ""}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {demand.unitName ?? demand.sectorName ?? demand.companyName}
                      </span>
                      <Link href={demand.href} className={cn(buttonVariants({ size: "sm" }))}>
                        Ver pauta
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
