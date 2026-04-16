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
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Sessão</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sair</h1>
        <p className="text-sm text-muted-foreground">
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

      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Voltar para o início
      </Link>
    </section>
  );
}
