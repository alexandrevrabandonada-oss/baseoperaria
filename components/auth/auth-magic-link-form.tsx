"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { normalizeEmail } from "@/lib/validation/workflows";

type AuthMagicLinkFormProps = {
  initialStatus?: string | undefined;
};

export function AuthMagicLinkForm({ initialStatus }: AuthMagicLinkFormProps) {
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const email = normalizeEmail(formData.get("email"));

    if (!email) {
      setStatus("email-invalido");
      return;
    }

    const emailRedirectTo = new URL(
      "/auth/confirm?next=/onboarding",
      window.location.origin,
    ).toString();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("[auth] falha ao enviar magic link", {
        code: error.code,
        email,
        message: error.message,
      });
      setStatus("erro-envio");
      return;
    }

    setStatus("link-enviado");
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      await handleSubmit(formData);
    });
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <AuthMessage status={status} />

      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="voce@empresa.com.br"
          onChange={() => {
            if (status === "email-invalido" || status === "erro-envio" || status === "link-enviado") {
              setStatus(undefined);
            }
          }}
        />
      </label>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando link..." : "Receber link de entrada"}
      </Button>
    </form>
  );
}