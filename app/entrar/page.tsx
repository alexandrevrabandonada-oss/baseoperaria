import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthMagicLinkForm } from "@/components/auth/auth-magic-link-form";
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

      <AuthMagicLinkForm initialStatus={params.status} />

      <p className="text-xs leading-5 text-muted-foreground">
        Na primeira entrada, voce preenche um cadastro rapido com pseudonimo e vinculo.
      </p>

      <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80">
        Voltar para a capa da base
      </Link>
    </section>
  );
}
