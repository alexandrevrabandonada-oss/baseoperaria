import Link from "next/link";
import { redirect } from "next/navigation";

import { NucleosEmptyState } from "@/components/nucleos/nucleos-empty-state";
import { NucleosStatusBanner } from "@/components/nucleos/nucleos-status-banner";
import { NucleusForm } from "@/components/nucleos/nucleus-form";
import { buttonVariants } from "@/components/ui/button";
import { getAuthContext } from "@/lib/supabase/queries";
import { getNucleusCreateContext } from "@/lib/supabase/nucleos";
import { cn } from "@/lib/utils";

type NucleosCreatePageProps = {
  searchParams: Promise<{
    company_id?: string;
    status?: string;
  }>;
};

export default async function NucleosCreatePage({ searchParams }: NucleosCreatePageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  const context = await getNucleusCreateContext(params.company_id ?? "");

  if (!context) {
    return (
      <NucleosEmptyState
        title="Escolha uma empresa administrativa"
        description="Você precisa ter acesso de moderador ou admin em uma empresa para criar núcleos."
        href="/nucleos"
        actionLabel="Voltar para Núcleos"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Novo núcleo</p>
              <h1 className="text-3xl font-semibold tracking-tight">{context.companyName}</h1>
            </div>
            <Link href="/nucleos" className={cn(buttonVariants({ variant: "outline" }))}>
              Voltar
            </Link>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Crie um núcleo por setor ou por tema. A adesão continua controlada e vinculada à
            empresa escolhida.
          </p>
        </div>
      </section>

      <NucleosStatusBanner status={params.status} />

      <NucleusForm context={context} returnTo={`/nucleos?company_id=${context.companyId}`} />
    </div>
  );
}
