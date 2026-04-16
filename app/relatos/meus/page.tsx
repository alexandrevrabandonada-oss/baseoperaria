import { redirect } from "next/navigation";

import { CompanyChips } from "@/components/relatos/company-chips";
import { RelatosEmptyState } from "@/components/relatos/relatos-empty-state";
import { RelatosStatusBanner } from "@/components/relatos/relatos-status-banner";
import { ReportsList } from "@/components/relatos/reports-list";
import { getMyReportsContext } from "@/lib/supabase/relatos";

type MeusRelatosPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function MeusRelatosPage({ searchParams }: MeusRelatosPageProps) {
  const params = await searchParams;
  const context = await getMyReportsContext(params.company_id);

  if (!context.user) {
    redirect("/entrar");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Meus relatos</p>
        <h1 className="text-3xl font-semibold tracking-tight">Acompanhamento dos seus envios</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Aqui aparecem apenas os relatos criados por você, sem feed social e sem exposição
          desnecessária.
        </p>
      </section>

      <RelatosStatusBanner status={params.status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompanyId}
        targetPath="/relatos/meus"
      />

      {context.reports.length > 0 ? (
        <ReportsList reports={context.reports} />
      ) : context.companies.length > 0 ? (
        <RelatosEmptyState
          actionHref={
            context.selectedCompanyId
              ? `/relatos/novo?company_id=${context.selectedCompanyId}`
              : "/relatos/novo"
          }
          title="Nenhum relato criado por você"
          description="Crie o primeiro relato para acompanhar o registro, as confirmações e os anexos num fluxo privado."
        />
      ) : (
        <RelatosEmptyState
          title="Sem empresa vinculada"
          description="Você precisa estar vinculado a uma empresa antes de criar ou acompanhar relatos."
        />
      )}
    </div>
  );
}
