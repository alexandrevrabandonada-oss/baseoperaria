import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { navigationItems } from "@/lib/navigation";
import { getModerationAccessContext } from "@/lib/supabase/moderation";
import { getAuthContext, hasCompletedOnboarding } from "@/lib/supabase/queries";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [auth, moderationAccess] = await Promise.all([getAuthContext(), getModerationAccessContext()]);
  const showOnboarding = auth.user && !hasCompletedOnboarding(auth);
  const showModeration = moderationAccess.canModerate;

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Base Operária
        </Link>
        <div className="hidden items-center gap-3 sm:flex">
          <nav aria-label="Principal">
            <ul className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {showModeration ? (
                <li>
                  <Link
                    href="/moderacao"
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Moderação
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {showOnboarding ? (
              <Link
                href="/onboarding"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Onboarding
              </Link>
            ) : null}

            {auth.user ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Sair
                </button>
              </form>
            ) : (
              <Link href="/entrar" className={cn(buttonVariants())}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
