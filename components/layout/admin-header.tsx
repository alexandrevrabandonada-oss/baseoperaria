import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getModerationAccessContext } from "@/lib/supabase/moderation";
import { adminSectionItems } from "@/types/admin";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  pathname: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export async function AdminHeader({ pathname }: AdminHeaderProps) {
  const moderationAccess = await getModerationAccessContext();
  const showModeration = moderationAccess.canModerate;

  return (
    <header className="sticky top-0 z-30 pt-0 sm:pt-4">
      <div className="overflow-hidden border-b border-border/80 bg-card/92 shadow-[0_16px_42px_rgb(0_0_0_/_0.26)] backdrop-blur supports-[backdrop-filter]:bg-card/82 sm:rounded-2xl sm:border">
      <div className="flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary/85">
              Núcleo administrativo
            </p>
            <Link href="/admin" className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-foreground sm:text-3xl">
              Base Operária
            </Link>
            <p className="text-xs text-muted-foreground">Administração restrita e estruturação de base</p>
          </div>

          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Voltar ao app
          </Link>
        </div>

        {showModeration ? (
          <div className="flex items-center gap-2">
            <Link href="/moderacao" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Moderação
            </Link>
          </div>
        ) : null}

        <nav aria-label="Administração">
          <ul className="flex flex-wrap gap-2">
            {adminSectionItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                    active
                      ? "border-primary/65 bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(0_0_0_/_0.25)]"
                      : "border-border bg-background/78 text-foreground hover:border-primary/45 hover:bg-muted/80 hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )})}
          </ul>
        </nav>
      </div>
      </div>
    </header>
  );
}
