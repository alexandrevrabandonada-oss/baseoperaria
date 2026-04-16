import { redirect } from "next/navigation";

import { NucleosEmptyState } from "@/components/nucleos/nucleos-empty-state";
import { NucleusDetailView } from "@/components/nucleos/nucleus-detail";
import { getAuthContext } from "@/lib/supabase/queries";
import { getNucleusDetailContext } from "@/lib/supabase/nucleos";

type NucleosDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function NucleosDetailPage({ params, searchParams }: NucleosDetailPageProps) {
  const [{ id }, paramsSearch, auth] = await Promise.all([params, searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getNucleusDetailContext(id);

  if (!context) {
    return (
      <NucleosEmptyState
        title="Núcleo indisponível"
        description="Esse núcleo não está liberado para o seu acesso ou pode ter saído de circulação."
        href="/nucleos"
        actionLabel="Voltar para núcleos"
      />
    );
  }

  return <NucleusDetailView context={context} status={paramsSearch.status} />;
}
