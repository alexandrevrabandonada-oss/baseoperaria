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
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-[0_20px_48px_rgb(0_0_0_/_0.34)] sm:p-7">
      <header className="flex flex-col gap-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/85">Cadastro inicial</p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.04em] text-foreground">
          Feche sua entrada na base
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Pedimos só o necessário para liberar sua entrada sem recolher dado sensível.
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
            placeholder="Como você quer aparecer na base"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Vínculo de base
          <input
            type="text"
            name="initialLink"
            required
            minLength={2}
            maxLength={60}
            defaultValue={auth.profile?.initial_link ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Ex.: setor, turno, território ou apoio"
          />
        </label>

        <p className="text-xs leading-5 text-muted-foreground">
          Não pedimos nome real, CPF, matrícula ou outros dados sensíveis nesta
          etapa.
        </p>

        <Button type="submit" className="w-full">
          Liberar entrada
        </Button>
      </form>
    </section>
  );
}
