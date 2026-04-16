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
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Pauta Econômica</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Registros econômicos separados e objetivos
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              O fluxo econômico coleta vínculo, faixa salarial, cargo formal e função real sem
              exigir valor salarial exato.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/economico/novo" className={cn(buttonVariants())}>
              Novo registro
            </Link>
            <Link href="/economico/meus" className={cn(buttonVariants({ variant: "outline" }))}>
              Meus registros econômicos
            </Link>
          </div>
        </div>
      </section>

      <EconomicStatusBanner status={params.status} />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Registros enviados
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.reportCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Empresas vinculadas
          </p>
          <p className="mt-2 text-2xl font-semibold">{context.companies.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fluxo
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Formulário, meus registros, detalhe e confirmação.
          </p>
        </div>
      </section>

      {context.companies.length > 0 ? (
        <CompanyChips companies={context.companies} targetPath="/economico/novo" />
      ) : (
        <EconomicEmptyState
          title="Sem empresa vinculada"
          description="Você ainda não está associado a nenhuma empresa. Sem isso, não há como abrir o formulário econômico."
        />
      )}
    </div>
  );
}
