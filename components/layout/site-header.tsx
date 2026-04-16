import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { navigationItems } from "@/lib/navigation";
import { getModerationAccessContext } from "@/lib/supabase/moderation";
import { getAuthContext, hasCompletedOnboarding } from "@/lib/supabase/queries";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  pathname: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export async function SiteHeader({ pathname }: SiteHeaderProps) {
  const [auth, moderationAccess] = await Promise.all([getAuthContext(), getModerationAccessContext()]);
  const showOnboarding = auth.user && !hasCompletedOnboarding(auth);
  const showModeration = moderationAccess.canModerate;

  return (
    <header className="sticky top-0 z-30 pt-0 sm:pt-4">
      <div className="overflow-hidden border-b border-border/80 bg-card/90 shadow-[0_16px_42px_rgb(0_0_0_/_0.26)] backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:rounded-2xl sm:border">
        <div className="flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary/85">
                Ferramenta de base
              </p>
              <Link href="/" className="block w-fit">
                <span className="block font-heading text-2xl font-bold uppercase tracking-[0.08em] text-foreground sm:text-3xl">
                  Base Operária
                </span>
              </Link>
              <p className="max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                Espaço fechado para registrar problema, juntar prova e puxar pauta coletiva.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              {auth.user ? (
                <form action={signOutAction}>
                  <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Sair
                  </button>
                </form>
              ) : (
                <Link href="/entrar" className={cn(buttonVariants({ size: "sm" }))}>
                  Entrar
                </Link>
              )}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              {showOnboarding ? (
                <Link href="/onboarding" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Fechar cadastro
                </Link>
              ) : null}

              {auth.user ? (
                <form action={signOutAction}>
                  <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Sair
                  </button>
                </form>
              ) : (
                <Link href="/entrar" className={cn(buttonVariants({ size: "sm" }))}>
                  Entrar
                </Link>
              )}
            </div>
          </div>

          <nav aria-label="Principal" className="hidden sm:block">
            <ul className="flex flex-wrap gap-2">
              {navigationItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                        active
                          ? "border-primary/65 bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(0_0_0_/_0.25)]"
                          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/72 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {showModeration ? (
                <li>
                  <Link
                    href="/moderacao"
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                      isActivePath(pathname, "/moderacao")
                        ? "border-primary/65 bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(0_0_0_/_0.25)]"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/72 hover:text-foreground",
                    )}
                  >
                    Moderação
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
