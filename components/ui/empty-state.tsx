import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  actionHref?: string | undefined;
  actionLabel?: string | undefined;
  actionVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link" | undefined;
  description: string;
  eyebrow?: string | undefined;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  actionVariant = "default",
  description,
  eyebrow = "Sem base ainda",
  title,
}: EmptyStateProps) {
  return (
    <section className="surface-subtle border-dashed">
      <div className="flex flex-col gap-3 sm:gap-4">
        <p className="section-kicker">
          {eyebrow}
        </p>
        <h2 className="text-xl font-bold uppercase tracking-[0.04em] text-foreground sm:text-2xl">{title}</h2>
        <p className="section-copy max-w-2xl">{description}</p>
        {actionHref && actionLabel ? (
          <div className="pt-1.5">
            <Link href={actionHref} className={cn(buttonVariants({ variant: actionVariant, size: "sm" }))}>
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}