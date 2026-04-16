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
        <h1 className="text-3xl font-semibold tracking-tight">Seus relatos na base</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Aqui aparecem só os relatos que você abriu, com confirmação, anexo e leitura do que já foi registrado.
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
          description="Abra seu primeiro relato para acompanhar prova, confirmação e desdobramento dentro da base."
        />
      ) : (
        <RelatosEmptyState
          title="Sem empresa vinculada"
          description="Você precisa estar ligado a uma empresa antes de abrir ou acompanhar relato." 
        />
      )}
    </div>
  );
}
