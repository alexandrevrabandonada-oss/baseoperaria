import { redirect } from "next/navigation";

import { PautasEmptyState } from "@/components/pautas/pautas-empty-state";
import { PautasStatusBanner } from "@/components/pautas/pautas-status-banner";
import { PautaForm } from "@/components/pautas/pauta-form";
import { getAuthContext } from "@/lib/supabase/queries";
import { getPautaCreateContext } from "@/lib/supabase/pautas";

type PautaNovaPageProps = {
  searchParams: Promise<{
    cluster_id?: string;
    status?: string;
  }>;
};

export default async function PautaNovaPage({ searchParams }: PautaNovaPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const clusterId = params.cluster_id?.trim() || null;

  if (!clusterId) {
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border bg-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Nova pauta</p>
            <h1 className="text-3xl font-semibold tracking-tight">Criar a partir de um cluster</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              A pauta nasce da área de clusters, onde o moderador já enxerga o conjunto de sinais
              antes de transformar o caso em uma agenda objetiva.
            </p>
          </div>
        </section>

        <PautasStatusBanner status={params.status} />

        <PautasEmptyState
          title="Selecione um cluster"
          description="Abra um cluster na área administrativa e use a ação de criar pauta para continuar."
          href="/admin/clusters"
          actionLabel="Abrir clusters"
        />
      </div>
    );
  }

  const context = await getPautaCreateContext(clusterId);

  if (!context) {
    return (
      <div className="flex flex-col gap-6">
        <PautasStatusBanner status={params.status} />
        <PautasEmptyState
          title="Cluster indisponível"
          description="Não foi possível carregar este cluster para criação de pauta."
          href="/admin/clusters"
          actionLabel="Voltar aos clusters"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Nova pauta</p>
          <h1 className="text-3xl font-semibold tracking-tight">Criar a partir de um cluster</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            O formulário fica curto: título, texto objetivo, tipo, prioridade, status e recorte
            organizacional quando fizer sentido.
          </p>
        </div>
      </section>

      <PautasStatusBanner status={params.status} />

      <PautaForm context={context} returnTo={`/pautas?company_id=${context.companyId}`} />
    </div>
  );
}
