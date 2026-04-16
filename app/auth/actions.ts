"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeEmail,
  parseOnboardingInput,
} from "@/lib/validation/workflows";

export async function signInWithMagicLinkAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    redirect("/entrar?status=email-invalido");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getSiteUrl("/auth/confirm?next=/onboarding"),
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("[auth] falha ao enviar magic link", {
        code: error.code,
        email,
        message: error.message,
      });
      redirect("/entrar?status=erro-envio");
    }
  } catch (error) {
    console.error("[auth] erro inesperado no envio de magic link", {
      email,
      error,
    });
    redirect("/entrar?status=erro-envio");
  }

  redirect("/entrar?status=link-enviado");
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/sair?status=erro");
  }

  revalidatePath("/", "layout");
  redirect("/entrar?status=sessao-encerrada");
}

export async function completeOnboardingAction(formData: FormData) {
  const parsed = parseOnboardingInput({
    initialLink: formData.get("initialLink"),
    pseudonym: formData.get("pseudonym"),
  });

  if ("error" in parsed) {
    redirect("/onboarding?status=dados-invalidos");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth] falha ao obter sessao no onboarding", {
      code: userError?.code,
      message: userError?.message,
    });
    redirect("/entrar?status=sessao-expirada");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      initial_link: parsed.value.initialLink,
      pseudonym: parsed.value.pseudonym,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    console.error("[auth] falha ao persistir profile no onboarding", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    redirect("/onboarding?status=erro-perfil");
  }

  revalidatePath("/", "layout");
  redirect("/?status=onboarding-concluido");
}
