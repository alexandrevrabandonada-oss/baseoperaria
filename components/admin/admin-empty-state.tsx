import { EmptyState } from "@/components/ui/empty-state";

type AdminEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
};

export function AdminEmptyState({
  actionHref,
  actionLabel = "Criar cadastro",
  description,
  title,
}: AdminEmptyStateProps) {
  return (
    <EmptyState
      actionHref={actionHref}
      actionLabel={actionLabel}
      description={description}
      eyebrow="Admin"
      title={title}
    />
  );
}
