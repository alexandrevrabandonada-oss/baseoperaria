import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NucleosEmptyStateProps = {
  description: string;
  href?: string;
  title: string;
  actionLabel?: string;
};

export function NucleosEmptyState({
  description,
  href,
  title,
  actionLabel,
}: NucleosEmptyStateProps) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {href && actionLabel ? (
          <div>
            <Link href={href} className={cn(buttonVariants({ variant: "outline" }))}>
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
