import { redirect } from "next/navigation";

import { NucleosListView } from "@/components/nucleos/nucleos-list";
import { getAuthContext } from "@/lib/supabase/queries";
import { getNucleusListContext } from "@/lib/supabase/nucleos";

type NucleosPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function NucleosPage({ searchParams }: NucleosPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getNucleusListContext(params.company_id);

  return <NucleosListView context={context} status={params.status} />;
}
