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
    <header className="sticky top-2 z-30">
      <div className="overflow-hidden rounded-2xl border border-border/75 bg-background/82 shadow-[0_12px_30px_rgb(0_0_0_/_0.24)] backdrop-blur supports-[backdrop-filter]:bg-background/72">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-primary/80 sm:block">
              Núcleo administrativo
            </p>
            <Link href="/admin" className="font-heading text-[1.35rem] font-bold uppercase tracking-[0.06em] text-foreground sm:text-[1.6rem]">
              Base Operária
            </Link>
            <p className="hidden text-xs text-muted-foreground md:block">Administração restrita e estruturação de base</p>
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
          <ul className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5">
            {adminSectionItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md border px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                    active
                      ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(0_0_0_/_0.2)]"
                      : "border-border/60 bg-background/40 text-foreground hover:border-primary/35 hover:bg-muted/62 hover:text-primary",
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
