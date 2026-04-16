import { redirect } from "next/navigation";

import { PautasListView } from "@/components/pautas/pautas-list";
import { getAuthContext } from "@/lib/supabase/queries";
import { getPautaListContext } from "@/lib/supabase/pautas";

type PautasPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function PautasPage({ searchParams }: PautasPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getPautaListContext(params.company_id);

  return <PautasListView context={context} status={params.status} />;
}
