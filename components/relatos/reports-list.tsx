import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { ReportListItem } from "@/lib/supabase/relatos";
import { cn } from "@/lib/utils";

type ReportsListProps = {
  reports: ReportListItem[];
};

export function ReportsList({ reports }: ReportsListProps) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {report.companyName}
              </p>
              <h2 className="text-lg font-semibold tracking-tight">{report.title}</h2>
              {report.description ? (
                <p className="text-sm text-muted-foreground">{report.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {report.unitName ? <span>{report.unitName}</span> : null}
              {report.sectorName ? <span>{report.sectorName}</span> : null}
              {report.shiftName ? <span>{report.shiftName}</span> : null}
              {report.categoryLabel ? <span>{report.categoryLabel}</span> : null}
              {report.severityLabel ? <span>{report.severityLabel}</span> : null}
              {report.frequencyLabel ? <span>{report.frequencyLabel}</span> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "medium",
                }).format(new Date(report.createdAt))}
              </span>
              <Link href={`/relatos/${report.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                Abrir
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
