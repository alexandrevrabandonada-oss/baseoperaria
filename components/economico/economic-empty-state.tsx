import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EconomicEmptyStateProps = {
  actionHref?: string;
  description: string;
  title: string;
};

export function EconomicEmptyState({
  actionHref,
  description,
  title,
}: EconomicEmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        {actionHref ? (
          <Link href={actionHref} className={cn(buttonVariants(), "mt-1 w-fit")}>
            Novo registro
          </Link>
        ) : null}
      </div>
    </section>
  );
}
