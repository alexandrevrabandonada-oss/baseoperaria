import { notFound, redirect } from "next/navigation";

import { ClusterDetailView } from "@/components/admin/clusters/cluster-detail";
import { getAuthContext } from "@/lib/supabase/queries";
import { getClusterDetailContext } from "@/lib/supabase/clusters";

type AdminClusterDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function AdminClusterDetailPage({
  params,
  searchParams,
}: AdminClusterDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getClusterDetailContext(id);

  if (!context) {
    notFound();
  }

  return <ClusterDetailView currentUserId={auth.user.id} context={context} status={query.status} />;
}
