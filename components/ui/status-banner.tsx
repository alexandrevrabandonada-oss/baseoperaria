import { cn } from "@/lib/utils";

type StatusBannerKind = "error" | "info" | "success" | "warning";

type StatusBannerProps = {
  kind: StatusBannerKind;
  message: string;
  title?: string;
};

const kindStyles: Record<StatusBannerKind, string> = {
  error: "border-destructive/45 bg-destructive/12",
  info: "border-border bg-muted/72",
  success: "border-primary/45 bg-primary/10",
  warning: "border-accent/50 bg-accent/12",
};

const kindLabels: Record<StatusBannerKind, string> = {
  error: "Erro",
  info: "Leitura",
  success: "Confirmado",
  warning: "Alerta",
};

const kindLabelColors: Record<StatusBannerKind, string> = {
  error: "text-destructive",
  info: "text-muted-foreground",
  success: "text-primary",
  warning: "text-accent",
};

export function StatusBanner({ kind, message, title }: StatusBannerProps) {
  return (
    <section className={cn("rounded-xl border px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.02)]", kindStyles[kind])}>
      <div className="flex flex-col gap-1.5 border-l-2 border-current/35 pl-3">
        <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.2em]", kindLabelColors[kind])}>
          {title ?? kindLabels[kind]}
        </p>
        <p className="text-sm leading-5 text-foreground">{message}</p>
      </div>
    </section>
  );
}