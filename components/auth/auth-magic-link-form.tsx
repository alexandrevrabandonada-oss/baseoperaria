"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AuthMagicLinkFormProps = {
  initialStatus?: string | undefined;
};

export function AuthMagicLinkForm({ initialStatus }: AuthMagicLinkFormProps) {
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [email, setEmail] = useState("");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorDetail(null);
      setStatus("email-invalido");
      return;
    }

    setIsSubmitting(true);
    setErrorDetail(null);

    try {
      const emailRedirectTo = new URL(
        "/auth/confirm?next=/onboarding",
        window.location.origin,
      ).toString();

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("[auth] falha ao enviar magic link", {
          code: error.code,
          email: normalizedEmail,
          message: error.message,
        });
        setErrorDetail(
          [error.code, error.message].filter(Boolean).join(": ") ||
            "Falha desconhecida ao pedir o magic link.",
        );
        setStatus("erro-envio");
        return;
      }

      setStatus("link-enviado");
    } catch (error) {
      console.error("[auth] excecao inesperada ao enviar magic link", {
        email: normalizedEmail,
        error,
      });
      setErrorDetail(
        error instanceof Error ? error.message : "Excecao desconhecida no navegador.",
      );
      setStatus("erro-envio");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);

    if (
      status === "email-invalido" ||
      status === "erro-envio" ||
      status === "link-enviado"
    ) {
      setStatus(undefined);
    }

    if (errorDetail) {
      setErrorDetail(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthMessage status={status} />

      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          required
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="voce@empresa.com.br"
          onChange={handleEmailChange}
        />
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando link..." : "Receber link de entrada"}
      </Button>

      {errorDetail ? (
        <p className="text-xs leading-5 text-destructive">Detalhe tecnico: {errorDetail}</p>
      ) : null}
    </form>
  );
}