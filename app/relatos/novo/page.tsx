import { redirect } from "next/navigation";

import { CompanyChips } from "@/components/relatos/company-chips";
import { RelatosEmptyState } from "@/components/relatos/relatos-empty-state";
import { RelatosStatusBanner } from "@/components/relatos/relatos-status-banner";
import { ReportForm } from "@/components/relatos/report-form";
import { getRelatosFormContext } from "@/lib/supabase/relatos";

type RelatosNovoPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function RelatosNovoPage({ searchParams }: RelatosNovoPageProps) {
  const params = await searchParams;
  const context = await getRelatosFormContext(params.company_id);

  if (!context.companies.length) {
    redirect("/relatos?status=sem-empresa");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Novo relato</p>
        <h1 className="text-3xl font-semibold tracking-tight">Registrar condição de trabalho</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          O formulário abaixo é curto e pensado para uso rápido no celular.
        </p>
      </section>

      <RelatosStatusBanner status={params.status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompanyId}
        targetPath="/relatos/novo"
      />

      {context.hasSelectedCompany &&
      context.selectedCompany &&
      context.categoryOptions.length > 0 ? (
        <ReportForm
          categoryOptions={context.categoryOptions}
          companyId={context.selectedCompany.id}
          companyName={context.selectedCompany.name}
          frequencyOptions={context.frequencyOptions}
          sectorOptions={context.sectorOptions}
          severityOptions={context.severityOptions}
          shiftOptions={context.shiftOptions}
          unitOptions={context.unitOptions}
        />
      ) : context.hasSelectedCompany && context.selectedCompany ? (
        <RelatosEmptyState
          title="Sem categorias cadastradas"
          description="Esta empresa ainda não tem categorias de relato de condições. A administração precisa cadastrar ao menos uma categoria para liberar o formulário."
        />
      ) : (
        <RelatosEmptyState
          title="Selecione uma empresa"
          description="Escolha uma empresa acima para carregar unidades, setores, turnos e categorias disponíveis."
        />
      )}
    </div>
  );
}
