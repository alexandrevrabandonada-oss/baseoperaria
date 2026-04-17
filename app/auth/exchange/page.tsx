"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function normalizeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default function AuthExchangePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function exchangeCode() {
      const code = searchParams.get("code") ?? undefined;
      const next = normalizeNextPath(searchParams.get("next") ?? undefined);

      if (!code) {
        window.location.replace("/entrar?status=callback-sem-codigo");
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[auth] falha ao validar code no navegador", {
            code: code.substring(0, 20),
            errorCode: error.code,
            errorMessage: error.message,
            errorStatus: error.status,
            next,
          });

          if (!cancelled) {
            window.location.replace("/entrar?status=callback-falhou");
          }

          return;
        }

        const destination = new URL(next, window.location.origin);

        if (destination.pathname === "/onboarding" && !destination.searchParams.has("status")) {
          destination.searchParams.set("status", "link-confirmado");
        }

        if (!cancelled) {
          window.location.replace(destination.toString());
        }
      } catch (error) {
        console.error("[auth] excecao inesperada ao validar code no navegador", {
          error,
        });

        if (!cancelled) {
          window.location.replace("/entrar?status=callback-falhou");
        }
      }
    }

    exchangeCode();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <section className="auth-panel">
      <header className="flex flex-col gap-2.5 sm:gap-3">
        <p className="section-kicker">Entrada privada</p>
        <h1 className="section-title text-3xl sm:text-[2.15rem]">Validando acesso</h1>
        <p className="section-copy max-w-none">
          Estamos confirmando seu link de entrada. Se nao concluir em instantes, peca
          um novo acesso.
        </p>
      </header>
    </section>
  );
}
