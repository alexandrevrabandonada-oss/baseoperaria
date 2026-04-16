import { EmptyState } from "@/components/ui/empty-state";

type PautasEmptyStateProps = {
  description: string;
  href?: string;
  title: string;
  actionLabel?: string;
};

export function PautasEmptyState({
  description,
  href,
  title,
  actionLabel,
}: PautasEmptyStateProps) {
  return (
    <EmptyState
      actionHref={href}
      actionLabel={actionLabel}
      description={description}
      eyebrow="Pautas"
      title={title}
    />
  );
}
