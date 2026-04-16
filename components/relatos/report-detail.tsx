import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ModerationAuditTrail } from "@/components/moderacao/moderation-audit-trail";
import type { ReportDetailContext } from "@/lib/supabase/relatos";
import { cn } from "@/lib/utils";
import { ReportConfirmationForm } from "@/components/relatos/report-confirmation-form";

type ReportDetailProps = {
  report: ReportDetailContext;
  currentUserId?: string | null;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ReportDetail({ currentUserId, report }: ReportDetailProps) {
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {report.companyName}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">{report.title}</h1>
            </div>
            <Link
              href={`/relatos/meus?company_id=${report.companyId}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Voltar para meus relatos
            </Link>
          </div>

          {report.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{report.description}</p>
          ) : null}

          <p className="text-xs text-muted-foreground">Criado em {dateLabel}</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Unidade" value={report.unitName} />
        <DetailRow label="Setor" value={report.sectorName} />
        <DetailRow label="Turno" value={report.shiftName} />
        <DetailRow label="Categoria" value={report.categoryLabel} />
        <DetailRow label="Gravidade" value={report.severityLabel} />
        <DetailRow label="Frequência" value={report.frequencyLabel} />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Confirmações</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.confirmationSummaries.map((item) => (
              <div key={item.code} className="rounded-xl border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold">{item.count}</p>
              </div>
            ))}
          </div>

          <ReportConfirmationForm
            isCreator={report.isCreator}
            myConfirmation={report.myConfirmation}
            reportId={report.id}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Anexos</h2>
          {report.attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma prova foi enviada com esse relato.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{attachment.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {attachment.mimeType ?? "Arquivo"}
                    </span>
                  </div>
                  {attachment.signedUrl ? (
                    <a
                      href={attachment.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Abrir
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {report.canViewModerationTrail ? (
        <ModerationAuditTrail
          currentUserId={currentUserId}
          description="Histórico interno de revisão e sinalização deste relato."
          emptyLabel="Nenhuma ação de moderação foi registrada para esse relato."
          events={report.moderationEvents}
          title="Trilha de auditoria"
        />
      ) : null}
    </div>
  );
}
