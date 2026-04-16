import { redirect } from "next/navigation";

import { completeOnboardingAction } from "@/app/auth/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
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
    redirect("/entrar?status=sessao-expirada");
  }

  if (hasCompletedOnboarding(auth)) {
    redirect("/");
  }

  return (
    <section className="auth-panel">
      <header className="flex flex-col gap-2.5 sm:gap-3">
        <p className="section-kicker">Primeira entrada</p>
        <h1 className="section-title text-3xl sm:text-[2.15rem]">
          Termine sua entrada na base
        </h1>
        <p className="section-copy max-w-none">
          Falta so o basico para liberar sua entrada com seguranca e sem expor voce.
        </p>
      </header>

      <AuthMessage status={params.status} />

      <form action={completeOnboardingAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Pseudônimo
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            Como voce vai aparecer na base.
          </span>
          <input
            type="text"
            name="pseudonym"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={40}
            defaultValue={auth.profile?.pseudonym ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Ex.: Metal 3, Turno B, Apoio Sul"
          />
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            Use entre 2 e 40 caracteres.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Qual e seu vinculo?
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            Pode ser setor, turno, funcao, territorio ou frente de apoio.
          </span>
          <input
            type="text"
            name="initialLink"
            required
            minLength={2}
            maxLength={60}
            defaultValue={auth.profile?.initial_link ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="Ex.: montagem, turno da noite, manutencao, apoio bairro"
          />
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            Use entre 2 e 60 caracteres.
          </span>
        </label>

        <p className="text-xs leading-5 text-muted-foreground">
          Seu pseudonimo protege sua identidade. Aqui entra so o essencial para comecar.
        </p>

        <AuthSubmitButton idleLabel="Entrar na base" pendingLabel="Liberando entrada..." />
      </form>
    </section>
  );
}
