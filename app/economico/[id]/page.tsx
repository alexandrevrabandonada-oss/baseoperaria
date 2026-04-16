import { notFound, redirect } from "next/navigation";

import { EconomicReportDetail } from "@/components/economico/economic-report-detail";
import { EconomicStatusBanner } from "@/components/economico/economic-status-banner";
import { getAuthContext } from "@/lib/supabase/queries";
import { getEconomicReportDetailContext } from "@/lib/supabase/economico";

type EconomicDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function EconomicDetailPage({
  params,
  searchParams,
}: EconomicDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const report = await getEconomicReportDetailContext(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <EconomicStatusBanner status={query.status} />
      <EconomicReportDetail currentUserId={auth.user.id} report={report} />
    </div>
  );
}
