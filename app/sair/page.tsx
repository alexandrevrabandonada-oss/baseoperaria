import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/lib/supabase/queries";

type LogoutPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const [params, auth] = await Promise.all([searchParams, getAuthContext()]);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-[0_20px_48px_rgb(0_0_0_/_0.34)] sm:p-7">
      <header className="flex flex-col gap-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary/85">Sessão</p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.04em] text-foreground">Sair</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {auth.user
            ? "Encerrar a sessão atual neste navegador."
            : "Nenhuma sessão ativa encontrada neste navegador."}
        </p>
      </header>

      <AuthMessage status={params.status} />

      {auth.user ? (
        <form action={signOutAction} className="flex flex-col gap-4">
          <Button type="submit" className="w-full">
            Encerrar sessão
          </Button>
        </form>
      ) : null}

      <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80">
        Voltar para a base
      </Link>
    </section>
  );
}
