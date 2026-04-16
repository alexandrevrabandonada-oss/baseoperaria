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
    <header className="sticky top-2 z-30">
      <div className="overflow-hidden rounded-2xl border border-border/75 bg-background/82 shadow-[0_12px_30px_rgb(0_0_0_/_0.24)] backdrop-blur supports-[backdrop-filter]:bg-background/72">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div className="min-w-0 space-y-1.5">
              <p className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-primary/80 sm:block">
                Ferramenta de base
              </p>
              <Link href="/" className="block w-fit">
                <span className="block font-heading text-[1.35rem] font-bold uppercase tracking-[0.06em] text-foreground sm:text-[1.6rem]">
                  Base Operária
                </span>
              </Link>
              <p className="hidden max-w-xl text-xs leading-5 text-muted-foreground md:block">
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
                <Link href="/entrar" className={cn(buttonVariants({ size: "sm" }), "shadow-[0_8px_18px_rgb(0_0_0_/_0.22)]")}>
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
                <Link href="/entrar" className={cn(buttonVariants({ size: "sm" }), "shadow-[0_8px_18px_rgb(0_0_0_/_0.22)]")}>
                  Entrar
                </Link>
              )}
            </div>
          </div>

          <nav aria-label="Principal" className="hidden sm:block">
            <ul className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5">
              {navigationItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex min-h-9 items-center rounded-md border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                        active
                          ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(0_0_0_/_0.2)]"
                          : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/35 hover:bg-muted/62 hover:text-foreground",
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
                      "inline-flex min-h-9 items-center rounded-md border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                      isActivePath(pathname, "/moderacao")
                        ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(0_0_0_/_0.2)]"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/35 hover:bg-muted/62 hover:text-foreground",
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
