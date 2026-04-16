import { redirect } from "next/navigation";

import { PautasEmptyState } from "@/components/pautas/pautas-empty-state";
import { PautasStatusBanner } from "@/components/pautas/pautas-status-banner";
import { PautaDetailView } from "@/components/pautas/pauta-detail";
import { getAuthContext } from "@/lib/supabase/queries";
import { getPautaDetailContext } from "@/lib/supabase/pautas";

type PautaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function PautaDetailPage({ params, searchParams }: PautaDetailPageProps) {
  const [{ id }, query, auth] = await Promise.all([params, searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getPautaDetailContext(id);

  if (!context) {
    return (
      <div className="flex flex-col gap-6">
        <PautasStatusBanner status={query.status} />
        <PautasEmptyState
          title="Pauta indisponível"
          description="Essa pauta não foi encontrada ou não está liberada para o seu acesso."
          href="/pautas"
          actionLabel="Voltar para pautas"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PautasStatusBanner status={query.status} />
      <PautaDetailView context={context} status={query.status} />
    </div>
  );
}
