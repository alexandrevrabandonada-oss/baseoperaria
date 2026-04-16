import { redirect } from "next/navigation";

import { ClusterListView } from "@/components/admin/clusters/cluster-list";
import { getAuthContext } from "@/lib/supabase/queries";
import { getClusterListContext } from "@/lib/supabase/clusters";

type AdminClustersPageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function AdminClustersPage({ searchParams }: AdminClustersPageProps) {
  const query = await searchParams;
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getClusterListContext(query.company_id);

  return <ClusterListView context={context} status={query.status} />;
}
