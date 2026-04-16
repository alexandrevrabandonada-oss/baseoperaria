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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getSiteUrl("/auth/confirm?next=/onboarding"),
      shouldCreateUser: true,
    },
  });

  if (error) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
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
    redirect("/onboarding?status=erro");
  }

  revalidatePath("/", "layout");
  redirect("/?status=onboarding-concluido");
}
