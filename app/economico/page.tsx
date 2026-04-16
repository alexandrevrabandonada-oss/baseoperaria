import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { CompanyChips } from "@/components/relatos/company-chips";
import { EconomicEmptyState } from "@/components/economico/economic-empty-state";
import { EconomicStatusBanner } from "@/components/economico/economic-status-banner";
import { getEconomicLandingContext } from "@/lib/supabase/economico";
import { cn } from "@/lib/utils";

type EconomicPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function EconomicPage({ searchParams }: EconomicPageProps) {
  const [params, context] = await Promise.all([searchParams, getEconomicLandingContext()]);

  if (!context.user) {
    redirect("/entrar");
  }

  return (
    <div className="page-stack">
      <section className="surface-hero">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-2">
            <p className="section-label">Pauta Econômica</p>
            <h1 className="section-title">
              Registrar o que pesa no bolso e no vínculo
            </h1>
            <p className="section-copy">
              Use este espaço para salário, desconto, desvio de função, vínculo e outros problemas
              de pauta econômica sem precisar informar valor exato.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/economico/novo" className={cn(buttonVariants())}>
              Abrir registro econômico
            </Link>
            <Link href="/economico/meus" className={cn(buttonVariants({ variant: "outline" }))}>
              Meus registros
            </Link>
          </div>
        </div>
      </section>

      <EconomicStatusBanner status={params.status} />

      <section className="metric-grid xl:grid-cols-3">
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Registros enviados
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.reportCount}</p>
        </div>
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Empresas vinculadas
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.companies.length}</p>
        </div>
        <div className="surface-metric xl:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fluxo
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Registro, confirmação, detalhe e prova.
          </p>
        </div>
      </section>

      {context.companies.length > 0 ? (
        <CompanyChips companies={context.companies} targetPath="/economico/novo" />
      ) : (
        <EconomicEmptyState
          title="Sem empresa vinculada"
          description="Você ainda não está ligado a nenhuma empresa. Sem esse vínculo, a base não libera a frente econômica."
        />
      )}
    </div>
  );
}
