import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithMagicLinkAction } from "@/app/auth/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
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
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Autenticação</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Entrar com magic link
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail para receber um link seguro de acesso.
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
            placeholder="voce@exemplo.com"
          />
        </label>

        <Button type="submit" className="w-full">
          Enviar link de acesso
        </Button>
      </form>

      <p className="text-xs leading-5 text-muted-foreground">
        Ao entrar pela primeira vez, você completa um onboarding curto com
        pseudônimo e vínculo inicial simples.
      </p>

      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Voltar para o início
      </Link>
    </section>
  );
}
