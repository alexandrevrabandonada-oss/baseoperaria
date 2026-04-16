import { redirect } from "next/navigation";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { CompanyAdminSection } from "@/components/admin/sections/company-admin-section";
import { CategoryAdminSection } from "@/components/admin/sections/category-admin-section";
import { SectorAdminSection } from "@/components/admin/sections/sector-admin-section";
import { ShiftAdminSection } from "@/components/admin/sections/shift-admin-section";
import { UnitAdminSection } from "@/components/admin/sections/unit-admin-section";
import { isAdminSectionSlug } from "@/types/admin";

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
  searchParams: Promise<{
    company_id?: string;
    edit?: string;
    status?: string;
  }>;
};

export default async function AdminSectionPage({
  params,
  searchParams,
}: AdminSectionPageProps) {
  const [{ section }, query] = await Promise.all([params, searchParams]);

  if (!isAdminSectionSlug(section)) {
    redirect("/admin");
  }

  if (section === "empresas") {
    return <CompanyAdminSection editId={query.edit} status={query.status} />;
  }

  if (section === "unidades") {
    return <UnitAdminSection companyId={query.company_id} editId={query.edit} status={query.status} />;
  }

  if (section === "setores") {
    return <SectorAdminSection companyId={query.company_id} editId={query.edit} status={query.status} />;
  }

  if (section === "turnos") {
    return <ShiftAdminSection companyId={query.company_id} editId={query.edit} status={query.status} />;
  }

  if (section === "categorias") {
    return (
      <CategoryAdminSection
        companyId={query.company_id}
        editId={query.edit}
        status={query.status}
      />
    );
  }

  if (section === "clusters") {
    redirect("/admin/clusters");
  }

  return <AdminEmptyState title="Seção indisponível" description="Volte para a área administrativa." />;
}
