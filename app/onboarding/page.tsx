import { redirect } from "next/navigation";

import { completeOnboardingAction } from "@/app/auth/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { getAuthContext, hasCompletedOnboarding } from "@/lib/supabase/queries";

type OnboardingPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (!auth.user) {
    redirect("/entrar");
  }

  if (hasCompletedOnboarding(auth)) {
    redirect("/");
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Onboarding</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Complete seu acesso inicial
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedimos só o essencial para abrir a sua sessão sem coletar dados
          sensíveis.
        </p>
      </header>

      <AuthMessage status={params.status} />

      <form action={completeOnboardingAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Pseudônimo
          <input
            type="text"
            name="pseudonym"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={40}
            defaultValue={auth.profile?.pseudonym ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Como você quer ser identificado(a)"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Vínculo inicial
          <input
            type="text"
            name="initialLink"
            required
            minLength={2}
            maxLength={60}
            defaultValue={auth.profile?.initial_link ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Ex.: território, trabalho, apoio"
          />
        </label>

        <p className="text-xs leading-5 text-muted-foreground">
          Não pedimos nome real, CPF, matrícula ou outros dados sensíveis nesta
          etapa.
        </p>

        <Button type="submit" className="w-full">
          Concluir onboarding
        </Button>
      </form>
    </section>
  );
}
