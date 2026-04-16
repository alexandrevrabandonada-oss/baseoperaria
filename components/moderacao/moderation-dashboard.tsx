import Link from "next/link";

import {
  archiveEconomicReportAction,
  archiveReportAction,
  attachEconomicReportToClusterAction,
  attachReportToClusterAction,
  flagAttachmentAction,
  flagEconomicReportAction,
  flagReportAction,
} from "@/app/moderacao/actions";
import { ModerationAuditTrail } from "@/components/moderacao/moderation-audit-trail";
import { ModerationStatusBanner } from "@/components/moderacao/moderation-status-banner";
import { buttonVariants } from "@/components/ui/button";
import type { ModerationDashboardContext } from "@/lib/supabase/moderation";
import { cn } from "@/lib/utils";

type ModerationDashboardProps = {
  context: ModerationDashboardContext;
  status: string | undefined;
};

function SectionMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/72 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ClusterLinkForm({
  action,
  companyId,
  clusterOptions,
  itemField,
  itemId,
  returnTo,
}: {
  action: (formData: FormData) => Promise<void>;
  companyId: string;
  clusterOptions: ModerationDashboardContext["reportClusters"];
  itemField: "report_id" | "economic_report_id";
  itemId: string;
  returnTo: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name={itemField} value={itemId} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          name="cluster_id"
          defaultValue=""
          required
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Escolha o cluster para agrupar</option>
          {clusterOptions.map((cluster) => (
            <option key={cluster.id} value={cluster.id}>
              {cluster.label} {cluster.meta ? `· ${cluster.meta}` : ""}
            </option>
          ))}
        </select>

        <button type="submit" className={cn(buttonVariants({ size: "default" }), "w-full sm:w-auto")}>
          Amarrar ao cluster
        </button>
      </div>
    </form>
  );
}

function ReviewCard({
  actionKind,
  companyId,
  clusterOptions,
  description,
  href,
  itemId,
  itemMeta,
  itemTitle,
  returnTo,
  status,
}: {
  actionKind: "report" | "economic";
  companyId: string;
  clusterOptions: ModerationDashboardContext["reportClusters"];
  description: string | null;
  href: string;
  itemId: string;
  itemMeta: string[];
  itemTitle: string;
  returnTo: string;
  status: string;
}) {
  const archiveAction = actionKind === "report" ? archiveReportAction : archiveEconomicReportAction;
  const flagAction = actionKind === "report" ? flagReportAction : flagEconomicReportAction;
  const attachAction =
    actionKind === "report" ? attachReportToClusterAction : attachEconomicReportToClusterAction;
  const attachmentField = actionKind === "report" ? "report_id" : "economic_report_id";

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {status}
            </p>
            <h3 className="truncate text-base font-semibold">{itemTitle}</h3>
            <p className="text-sm text-muted-foreground">{itemMeta.filter(Boolean).join(" · ")}</p>
          </div>

          <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Ver item
          </Link>
        </div>

        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}

        <div className="flex flex-wrap gap-2">
          <form action={flagAction}>
            <input type="hidden" name="company_id" value={companyId} />
            <input type="hidden" name={attachmentField} value={itemId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sinalizar
            </button>
          </form>

          <form action={archiveAction}>
            <input type="hidden" name="company_id" value={companyId} />
            <input type="hidden" name={attachmentField} value={itemId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Arquivar
            </button>
          </form>
        </div>

        <ClusterLinkForm
          action={attachAction}
          clusterOptions={clusterOptions}
          companyId={companyId}
          itemField={attachmentField}
          itemId={itemId}
          returnTo={returnTo}
        />
      </div>
    </article>
  );
}

function AttachmentCard({
  companyId,
  item,
  returnTo,
}: {
  companyId: string;
  item: ModerationDashboardContext["attachments"][number];
  returnTo: string;
}) {
  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.kindLabel}
            </p>
            <h3 className="truncate text-base font-semibold">{item.fileName}</h3>
            <p className="text-sm text-muted-foreground">{item.parentTitle}</p>
          </div>

          {item.signedUrl ? (
            <a
              href={item.signedUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Abrir
            </a>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(item.createdAt))}
        </p>

        <form action={flagAttachmentAction} className="flex flex-col gap-2">
          <input type="hidden" name="company_id" value={companyId} />
          <input type="hidden" name="attachment_id" value={item.id} />
          <input type="hidden" name="attachment_kind" value={item.kindLabel === "Relato" ? "report_attachment" : "economic_report_attachment"} />
          <input type="hidden" name="return_to" value={returnTo} />
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Sinalizar prova
          </button>
        </form>
      </div>
    </article>
  );
}

export function ModerationDashboard({ context, status }: ModerationDashboardProps) {
  const returnTo = `/moderacao?company_id=${context.selectedCompanyId ?? ""}`;
  const selectedCompany = context.selectedCompany;

  if (!selectedCompany) {
    return (
      <div className="page-stack">
        <section className="surface-hero">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="section-label">
                Moderação
              </p>
              <h1 className="section-title">Revisão inicial</h1>
              <p className="section-copy">
                Área para revisar relatos, registros econômicos e provas, amarrar sinais em cluster e deixar rastro de cada ação crítica.
              </p>
            </div>

            {context.companies.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {context.companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/moderacao?company_id=${company.id}`}
                    className={cn(
                      buttonVariants({
                        variant: context.selectedCompanyId === company.id ? "default" : "outline",
                        size: "sm",
                      }),
                    )}
                  >
                    {company.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <ModerationStatusBanner status={status} />

        <section className="surface-subtle border-dashed">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Escolha uma empresa</h2>
            <p className="text-sm text-muted-foreground">
              Você precisa ter moderação ou administração em uma empresa para revisar o material desta área.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="surface-hero">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="section-label">
              Moderação
            </p>
            <h1 className="section-title">Revisão inicial</h1>
            <p className="section-copy">
              Área mínima para revisar relatos, registros econômicos e anexos, vincular itens a
              clusters e registrar toda ação crítica.
            </p>
          </div>

          {context.companies.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {context.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/moderacao?company_id=${company.id}`}
                  className={cn(
                    buttonVariants({
                      variant: context.selectedCompanyId === company.id ? "default" : "outline",
                      size: "sm",
                    }),
                  )}
                >
                  {company.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <ModerationStatusBanner status={status} />

      <>
        <section className="metric-grid">
          <SectionMeta label="Relatos" value={String(context.reports.length)} />
          <SectionMeta label="Registros econômicos" value={String(context.economicReports.length)} />
          <SectionMeta label="Anexos" value={String(context.attachments.length)} />
          <SectionMeta label="Ações recentes" value={String(context.recentEvents.length)} />
        </section>

        <section className="surface-panel p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">Relatos em revisão</h2>
              <p className="text-sm text-muted-foreground">
                Aqui você sinaliza, arquiva ou agrupa cada relato no cluster certo.
              </p>
            </div>

            {context.reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum relato está esperando revisão agora.</p>
            ) : (
              <div className="grid gap-3">
                {context.reports.map((item) => (
                  <ReviewCard
                    key={item.id}
                    actionKind="report"
                    companyId={selectedCompany.id}
                    clusterOptions={context.reportClusters}
                    description={item.description}
                    href={`/relatos/${item.id}`}
                    itemId={item.id}
                    itemMeta={[
                      item.unitName ?? "",
                      item.sectorName ?? "",
                      item.shiftName ?? "",
                      item.categoryLabel ?? "",
                      item.severityLabel ?? "",
                      item.clusterCount > 0 ? `${item.clusterCount} cluster(s)` : "Sem cluster ligado",
                    ]}
                    itemTitle={item.title}
                    returnTo={returnTo}
                    status={item.status}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="surface-panel p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">Registros econômicos em revisão</h2>
              <p className="text-sm text-muted-foreground">
                O mesmo circuito vale para a pauta econômica, sem abrir uma estrutura separada.
              </p>
            </div>

            {context.economicReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro econômico está esperando revisão agora.
              </p>
            ) : (
              <div className="grid gap-3">
                {context.economicReports.map((item) => (
                  <ReviewCard
                    key={item.id}
                    actionKind="economic"
                    companyId={selectedCompany.id}
                    clusterOptions={context.reportClusters}
                    description={item.description}
                    href={`/economico/${item.id}`}
                    itemId={item.id}
                    itemMeta={[
                      item.unitName ?? "",
                      item.sectorName ?? "",
                      item.shiftName ?? "",
                      item.contractTypeLabel ?? "",
                      item.salaryBandLabel ?? "",
                      item.issueTypeLabel ?? "",
                      item.formalRole ?? "",
                      item.realFunction ?? "",
                      item.clusterCount > 0 ? `${item.clusterCount} cluster(s)` : "Sem cluster ligado",
                    ]}
                    itemTitle={item.title}
                    returnTo={returnTo}
                    status={item.status}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">Anexos recentes</h2>
              <p className="text-sm text-muted-foreground">
                Revisar prova é conferir o material e registrar sinalização sem expor mais do que precisa.
              </p>
            </div>

            {context.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma prova recente apareceu aqui.</p>
            ) : (
              <div className="grid gap-3">
                {context.attachments.map((item) => (
                  <AttachmentCard
                    key={item.id}
                    companyId={selectedCompany.id}
                    item={item}
                    returnTo={returnTo}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <ModerationAuditTrail
          currentUserId={context.userId}
          description="Trilha recente do que foi marcado, arquivado, ligado e revisto nessa empresa."
          emptyLabel="Ainda não houve ação de moderação registrada aqui."
          events={context.recentEvents}
          title="Rastro recente"
        />
      </>
    </div>
  );
}
