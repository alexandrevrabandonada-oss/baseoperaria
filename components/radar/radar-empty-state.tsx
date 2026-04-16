import { EmptyState } from "@/components/ui/empty-state";

type RadarEmptyStateProps = {
  description: string;
  title: string;
};

export function RadarEmptyState({ description, title }: RadarEmptyStateProps) {
  return <EmptyState description={description} eyebrow="Radar" title={title} />;
}
