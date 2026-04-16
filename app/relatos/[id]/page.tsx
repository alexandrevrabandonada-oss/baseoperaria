import { notFound, redirect } from "next/navigation";

import { RelatosStatusBanner } from "@/components/relatos/relatos-status-banner";
import { ReportDetail } from "@/components/relatos/report-detail";
import { getAuthContext } from "@/lib/supabase/queries";
import { getReportDetailContext } from "@/lib/supabase/relatos";

type RelatoDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function RelatoDetailPage({
  params,
  searchParams,
}: RelatoDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const report = await getReportDetailContext(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <RelatosStatusBanner status={query.status} />
      <ReportDetail currentUserId={auth.user.id} report={report} />
    </div>
  );
}
