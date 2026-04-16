import Link from "next/link";

import { navigationItems } from "@/lib/navigation";
import { getModerationAccessContext } from "@/lib/supabase/moderation";

export async function MobileBottomNav() {
  const moderationAccess = await getModerationAccessContext();
  const showModeration = moderationAccess.canModerate;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur sm:hidden">
      <ul className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2">
        {navigationItems.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex min-h-11 items-center justify-center rounded-md px-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
        {showModeration ? (
          <li className="flex-1">
            <Link
              href="/moderacao"
              className="flex min-h-11 items-center justify-center rounded-md px-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Moderação
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
