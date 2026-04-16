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
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/entrar?status=callback-sem-codigo", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    const destination = new URL(next, requestUrl.origin);

    if (destination.pathname === "/onboarding" && !destination.searchParams.has("status")) {
      destination.searchParams.set("status", "link-confirmado");
    }

    return NextResponse.redirect(destination);
  }

  console.error("[auth] falha no callback de confirmacao", {
    code: code?.substring(0, 20),
    errorCode: error?.code,
    errorMessage: error?.message,
    errorStatus: error?.status,
    next,
  });

  return NextResponse.redirect(new URL("/entrar?status=callback-falhou", requestUrl.origin));
}
