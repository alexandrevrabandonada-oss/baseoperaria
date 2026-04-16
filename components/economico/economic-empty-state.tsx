import { EmptyState } from "@/components/ui/empty-state";

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
    <EmptyState
      actionHref={actionHref}
      actionLabel="Novo registro"
      description={description}
      eyebrow="Econômico"
      title={title}
    />
  );
}
