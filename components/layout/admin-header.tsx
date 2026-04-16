import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getModerationAccessContext } from "@/lib/supabase/moderation";
import { adminSectionItems } from "@/types/admin";
import { cn } from "@/lib/utils";

export async function AdminHeader() {
  const moderationAccess = await getModerationAccessContext();
  const showModeration = moderationAccess.canModerate;

  return (
    <header className="border-b bg-background">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link href="/admin" className="text-base font-semibold tracking-tight">
              Base Operária
            </Link>
            <p className="text-xs text-muted-foreground">Administração restrita</p>
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
            {adminSectionItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
