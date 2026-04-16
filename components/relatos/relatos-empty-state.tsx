import { EmptyState } from "@/components/ui/empty-state";

type RelatosEmptyStateProps = {
  actionHref?: string;
  description: string;
  title: string;
};

export function RelatosEmptyState({
  actionHref,
  description,
  title,
}: RelatosEmptyStateProps) {
  return (
    <EmptyState
      actionHref={actionHref}
      actionLabel="Criar relato"
      description={description}
      eyebrow="Relatos"
      title={title}
    />
  );
}
