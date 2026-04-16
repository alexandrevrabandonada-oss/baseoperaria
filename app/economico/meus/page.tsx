import { redirect } from "next/navigation";

import { CompanyChips } from "@/components/relatos/company-chips";
import { EconomicEmptyState } from "@/components/economico/economic-empty-state";
import { EconomicReportsList } from "@/components/economico/economic-reports-list";
import { EconomicStatusBanner } from "@/components/economico/economic-status-banner";
import { getMyEconomicReportsContext } from "@/lib/supabase/economico";

type MeusEconomicReportsPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function MeusEconomicReportsPage({
  searchParams,
}: MeusEconomicReportsPageProps) {
  const params = await searchParams;
  const context = await getMyEconomicReportsContext(params.company_id);

  if (!context.user) {
    redirect("/entrar");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Meus registros econômicos</p>
        <h1 className="text-3xl font-semibold tracking-tight">Acompanhamento dos seus envios</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Aqui aparecem apenas os registros econômicos criados por você.
        </p>
      </section>

      <EconomicStatusBanner status={params.status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompanyId}
        targetPath="/economico/meus"
      />

      {context.reports.length > 0 ? (
        <EconomicReportsList reports={context.reports} />
      ) : context.companies.length > 0 ? (
        <EconomicEmptyState
          actionHref={
            context.selectedCompanyId
              ? `/economico/novo?company_id=${context.selectedCompanyId}`
              : "/economico/novo"
          }
          title="Nenhum registro criado por você"
          description="Crie o primeiro registro para acompanhar o histórico, as confirmações e os anexos em um fluxo privado."
        />
      ) : (
        <EconomicEmptyState
          title="Sem empresa vinculada"
          description="Você precisa estar vinculado a uma empresa antes de criar ou acompanhar registros econômicos."
        />
      )}
    </div>
  );
}
