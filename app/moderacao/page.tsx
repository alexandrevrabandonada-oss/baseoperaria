import { redirect } from "next/navigation";

import { ModerationDashboard } from "@/components/moderacao/moderation-dashboard";
import { getAuthContext } from "@/lib/supabase/queries";
import { getModerationDashboardContext } from "@/lib/supabase/moderation";

type ModeracaoPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function ModeracaoPage({ searchParams }: ModeracaoPageProps) {
  const query = await searchParams;
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getModerationDashboardContext(query.company_id);

  if (!context.canModerate) {
    redirect("/");
  }

  return <ModerationDashboard context={context} status={query.status} />;
}
