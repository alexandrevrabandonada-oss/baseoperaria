import { redirect } from "next/navigation";

import { RadarDashboard } from "@/components/radar/radar-dashboard";
import { getAuthContext } from "@/lib/supabase/queries";
import { getRadarDashboardContext } from "@/lib/supabase/radar";

type RadarPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function RadarPage({ searchParams }: RadarPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getRadarDashboardContext(params.company_id);

  return <RadarDashboard context={context} status={params.status} />;
}
