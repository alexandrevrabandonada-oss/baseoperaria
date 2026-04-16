import { EmptyState } from "@/components/ui/empty-state";

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
    <EmptyState
      actionHref={href}
      actionLabel={actionLabel}
      description={description}
      eyebrow="Núcleos"
      title={title}
    />
  );
}
