import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function normalizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination = new URL(next, requestUrl.origin);

      if (destination.pathname === "/onboarding" && !destination.searchParams.has("status")) {
        destination.searchParams.set("status", "link-confirmado");
      }

      return NextResponse.redirect(destination);
    }

    console.error("[auth] falha no callback de confirmacao por token_hash", {
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStatus: error?.status,
      next,
      type,
    });

    return NextResponse.redirect(new URL("/entrar?status=callback-falhou", requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/entrar?status=callback-sem-codigo", requestUrl.origin));
  }

  const clientExchangeUrl = new URL("/auth/exchange", requestUrl.origin);
  clientExchangeUrl.searchParams.set("code", code);
  clientExchangeUrl.searchParams.set("next", next);

  return NextResponse.redirect(clientExchangeUrl);
}
