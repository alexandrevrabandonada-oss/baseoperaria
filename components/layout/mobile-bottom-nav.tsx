import Link from "next/link";

import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { getModerationAccessContext } from "@/lib/supabase/moderation";

type MobileBottomNavProps = {
  pathname: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export async function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  const moderationAccess = await getModerationAccessContext();
  const showModeration = moderationAccess.canModerate;
  const items = showModeration
    ? [...navigationItems, { label: "Moderação", href: "/moderacao" }]
    : navigationItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/94 shadow-[0_-18px_36px_rgb(0_0_0_/_0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/88 sm:hidden">
      <ul
        className="mx-auto grid max-w-6xl gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={item.href} className="min-w-0">
            <Link
              href={item.href}
              className={cn(
                "flex min-h-12 items-center justify-center rounded-md border px-2 text-center text-[0.64rem] font-semibold uppercase leading-4 tracking-[0.12em] transition-colors",
                isActivePath(pathname, item.href)
                  ? "border-primary/65 bg-primary text-primary-foreground shadow-[0_8px_18px_rgb(0_0_0_/_0.22)]"
                  : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
