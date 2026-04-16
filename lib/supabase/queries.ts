import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const getAuthContext = cache(async () => {
  if (!isSupabaseConfigured()) {
    return {
      profile: null,
      user: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[queries] falha ao obter usuario autenticado", {
      code: userError.code,
      message: userError.message,
    });
  }

  if (!user) {
    return {
      profile: null,
      user: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, pseudonym, initial_link, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[queries] falha ao carregar profile", {
      code: profileError.code,
      message: profileError.message,
      userId: user.id,
    });
  }

  return {
    profile,
    user,
  };
});

export function hasCompletedOnboarding(input: {
  profile: {
    initial_link: string;
    pseudonym: string;
  } | null;
}) {
  return Boolean(input.profile?.pseudonym && input.profile?.initial_link);
}
