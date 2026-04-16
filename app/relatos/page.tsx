import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { CompanyChips } from "@/components/relatos/company-chips";
import { RelatosEmptyState } from "@/components/relatos/relatos-empty-state";
import { RelatosStatusBanner } from "@/components/relatos/relatos-status-banner";
import { getRelatosLandingContext } from "@/lib/supabase/relatos";
import { cn } from "@/lib/utils";

type RelatosPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function RelatosPage({ searchParams }: RelatosPageProps) {
  const [params, context] = await Promise.all([searchParams, getRelatosLandingContext()]);

  if (!context.user) {
    redirect("/entrar");
  }

  return (
    <div className="page-stack">
      <section className="surface-hero">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-2">
            <p className="section-label">Relatos</p>
            <h1 className="section-title">
              Registrar o que está pegando no trabalho
            </h1>
            <p className="section-copy">
              Abra um registro curto, direto e privado sobre ritmo, risco, chefia, equipamento,
              setor ou turno sem expor dado além do necessário.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/relatos/novo" className={cn(buttonVariants())}>
              Registrar problema
            </Link>
            <Link href="/relatos/meus" className={cn(buttonVariants({ variant: "outline" }))}>
              Meus relatos
            </Link>
          </div>
        </div>
      </section>

      <RelatosStatusBanner status={params.status} />

      <section className="metric-grid xl:grid-cols-3">
        <div className="surface-metric">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Relatos enviados
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
        <CompanyChips companies={context.companies} targetPath="/relatos/novo" />
      ) : (
        <RelatosEmptyState
          title="Sem empresa vinculada"
          description="Você ainda não está ligado a nenhuma empresa. Sem esse vínculo, a base não libera relato nesse espaço."
        />
      )}
    </div>
  );
}
