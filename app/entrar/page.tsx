import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithMagicLinkAction } from "@/app/auth/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getAuthContext, hasCompletedOnboarding } from "@/lib/supabase/queries";

type LoginPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  if (auth.user) {
    redirect(hasCompletedOnboarding(auth) ? "/" : "/onboarding");
  }

  return (
    <section className="auth-panel">
      <header className="flex flex-col gap-2.5 sm:gap-3">
        <p className="section-kicker">Entrada privada</p>
        <h1 className="section-title text-3xl sm:text-[2.15rem]">
          Entrar na base
        </h1>
        <p className="section-copy max-w-none">
          Digite seu e-mail para receber um link de entrada segura na base.
        </p>
      </header>

      <AuthMessage status={params.status} />

      <form action={signInWithMagicLinkAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="voce@empresa.com.br"
          />
        </label>

        <AuthSubmitButton idleLabel="Receber link de entrada" pendingLabel="Enviando link..." />
      </form>

      <p className="text-xs leading-5 text-muted-foreground">
        Na primeira entrada, voce preenche um cadastro rapido com pseudonimo e vinculo.
      </p>

      <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80">
        Voltar para a capa da base
      </Link>
    </section>
  );
}
