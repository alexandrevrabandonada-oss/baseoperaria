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
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-[0_20px_48px_rgb(0_0_0_/_0.34)] sm:p-7">
      <header className="flex flex-col gap-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/85">Entrada privada</p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.04em] text-foreground">
          Entrar na base
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Informe seu e-mail para receber um link privado de entrada.
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
          Receber link de entrada
        </Button>
      </form>

      <p className="text-xs leading-5 text-muted-foreground">
        Na primeira entrada, você fecha um cadastro curto com pseudônimo e vínculo de base.
      </p>

      <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80">
        Voltar para a base
      </Link>
    </section>
  );
}
