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
    <section className="rounded-xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/85">
          {eyebrow}
        </p>
        <h2 className="text-xl font-bold uppercase tracking-[0.04em] text-foreground">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        {actionHref && actionLabel ? (
          <div className="pt-1">
            <Link href={actionHref} className={cn(buttonVariants({ variant: actionVariant }))}>
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}