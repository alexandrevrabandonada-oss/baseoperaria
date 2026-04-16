import { redirect } from "next/navigation";

import { CompanyChips } from "@/components/relatos/company-chips";
import { EconomicEmptyState } from "@/components/economico/economic-empty-state";
import { EconomicReportForm } from "@/components/economico/economic-report-form";
import { EconomicStatusBanner } from "@/components/economico/economic-status-banner";
import { getEconomicFormContext } from "@/lib/supabase/economico";

type EconomicNovoPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function EconomicNovoPage({ searchParams }: EconomicNovoPageProps) {
  const params = await searchParams;
  const context = await getEconomicFormContext(params.company_id);

  if (!context.companies.length) {
    redirect("/economico?status=sem-empresa");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Novo registro econômico</p>
        <h1 className="text-3xl font-semibold tracking-tight">Registrar pauta econômica</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          O formulário é curto e direto, sem exigir valor exato nem abrir sua vida financeira.
        </p>
      </section>

      <EconomicStatusBanner status={params.status} />

      <CompanyChips
        companies={context.companies}
        selectedCompanyId={context.selectedCompanyId}
        targetPath="/economico/novo"
      />

      {context.hasSelectedCompany && context.selectedCompany ? (
        context.issueTypeOptions.length > 0 ? (
          <EconomicReportForm
            companyId={context.selectedCompany.id}
            companyName={context.selectedCompany.name}
            contractTypeOptions={context.contractTypeOptions}
            issueTypeOptions={context.issueTypeOptions}
            salaryBandOptions={context.salaryBandOptions}
            sectorOptions={context.sectorOptions}
            severityOptions={context.severityOptions}
            shiftOptions={context.shiftOptions}
            unitOptions={context.unitOptions}
          />
        ) : (
          <EconomicEmptyState
            title="Sem tipos econômicos cadastrados"
            description="Essa empresa ainda não tem tipo de pauta econômica liberado. Cadastre ao menos um para abrir o registro."
          />
        )
      ) : (
        <EconomicEmptyState
          title="Selecione uma empresa"
          description="Escolha a empresa acima para puxar unidade, setor, turno e apoio desse registro."
        />
      )}
    </div>
  );
}
