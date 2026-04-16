import Link from "next/link";

import { ModerationAuditTrail } from "@/components/moderacao/moderation-audit-trail";
import {
  attachEconomicReportToClusterAction,
  attachReportToClusterAction,
  detachEconomicReportFromClusterAction,
  detachReportFromClusterAction,
} from "@/app/admin/clusters/actions";
import { ClusterForm } from "@/components/admin/clusters/cluster-form";
import { AdminStatusBanner } from "@/components/admin/admin-status-banner";
import { buttonVariants } from "@/components/ui/button";
import type { ClusterDetailContext } from "@/lib/supabase/clusters";
import { cn } from "@/lib/utils";
import { clusterStatusOptions } from "@/types/clusters";

type ClusterDetailViewProps = {
  context: ClusterDetailContext;
  currentUserId?: string | null;
  status: string | undefined;
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

function SignalCard({
  hint,
  label,
  value,
}: {
  hint: string | null;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AssociationForm({
  action,
  clusterId,
  companyId,
  emptyLabel,
  items,
  name,
  returnTo,
  submitLabel,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  clusterId: string;
  companyId: string;
  emptyLabel: string;
  items: Array<{ id: string; label: string; meta: string | null }>;
  name: string;
  returnTo: string;
  submitLabel: string;
  title: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="cluster_id" value={clusterId} />
      <input type="hidden" name="company_id" value={companyId} />

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-2 text-sm font-medium">
          {title}
          <select
            name={name}
            required
            defaultValue=""
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">{items.length > 0 ? "Selecione um item" : emptyLabel}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.meta ? `${item.label} · ${item.meta}` : item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className={cn(buttonVariants({ size: "default" }), "w-full md:w-auto")}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function LinkedItemCard({
  action,
  clusterId,
  companyId,
  href,
  idField,
  itemId,
  itemLabel,
  itemMeta,
  returnTo,
  summary,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  clusterId: string;
  companyId: string;
  href: string;
  idField: "report_id" | "economic_report_id";
  itemId: string;
  itemLabel: string;
  itemMeta: Array<string | null>;
  returnTo: string;
  summary: string | null;
  title: string;
}) {
  const metaLabel = itemMeta.filter((value): value is string => Boolean(value)).join(" · ");

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {metaLabel || itemLabel}
            </p>
          </div>
          <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Abrir
          </Link>
        </div>

        {summary ? <p className="text-sm leading-6 text-muted-foreground">{summary}</p> : null}

        <form action={action}>
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="cluster_id" value={clusterId} />
          <input type="hidden" name="company_id" value={companyId} />
          <input type="hidden" name={idField} value={itemId} />
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Remover vínculo
          </button>
        </form>
      </div>
    </article>
  );
}

export function ClusterDetailView({ context, currentUserId, status }: ClusterDetailViewProps) {
  const returnTo = `/admin/clusters?company_id=${context.companyId}`;
  const statusLabel =
    clusterStatusOptions.find((option) => option.code === context.status)?.label ?? context.status;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(context.createdAt));
  const updatedLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(context.updatedAt));

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border bg-card p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {context.companyName}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">{context.title}</h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
                Voltar
              </Link>
              <Link
                href={`/pautas/nova?cluster_id=${context.id}`}
                className={cn(buttonVariants())}
              >
                Criar pauta
              </Link>
            </div>
          </div>

          {context.summary ? (
            <p className="text-sm leading-6 text-muted-foreground">{context.summary}</p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Sem descrição.</p>
          )}

          <p className="text-xs text-muted-foreground">
            Criado em {dateLabel} · Atualizado em {updatedLabel}
          </p>
        </div>
      </section>

      <AdminStatusBanner status={status} />

      <ClusterForm
        categories={context.categoryOptions}
        cluster={{
          categoryId: context.categoryId,
          id: context.id,
          status: context.status,
          summary: context.summary,
          title: context.title,
        }}
        companyId={context.companyId}
        companyName={context.companyName}
        description="Edite título, descrição, categoria e status sem alterar a estrutura do vínculo."
        returnTo={returnTo}
        submitLabel="Salvar cluster"
        title="Editar cluster"
      />

      <section className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Categoria" value={context.categoryLabel} />
        <DetailRow label="Escopo" value={context.scopeLabel} />
        <DetailRow label="Status" value={statusLabel} />
        <DetailRow label="Vínculos totais" value={String(context.linkCount)} />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Sinais agregados</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SignalCard
              label="Relatos de condições"
              value={String(context.linkedReports.length)}
              hint="Itens vinculados ao cluster."
            />
            <SignalCard
              label="Registros econômicos"
              value={String(context.linkedEconomicReports.length)}
              hint="Itens econômicos vinculados ao cluster."
            />
            <SignalCard
              label="Total consolidado"
              value={String(context.linkCount)}
              hint="Soma simples entre os dois fluxos."
            />
            <SignalCard
              label="Tipo de ponte"
              value={context.scopeLabel}
              hint={context.categoryLabel ? `Baseado em ${context.categoryLabel}` : "Derivado dos vínculos"}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Relatos vinculados</h2>
            <p className="text-sm text-muted-foreground">
              Moderadores podem amarrar relatos de condições ao mesmo agrupamento manualmente.
            </p>
          </div>

          {context.linkedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum relato de condições vinculado.</p>
          ) : (
            <div className="grid gap-3">
              {context.linkedReports.map((item) => (
                <LinkedItemCard
                  key={item.id}
                  action={detachReportFromClusterAction}
                  clusterId={context.id}
                  companyId={context.companyId}
                  href={item.href}
                  idField="report_id"
                  itemId={item.id}
                  itemLabel={item.statusLabel}
                  itemMeta={[
                    item.unitName,
                    item.sectorName,
                    item.shiftName,
                    item.categoryLabel,
                    item.severityLabel,
                    item.frequencyLabel,
                  ]}
                  returnTo={returnTo}
                  summary={item.description}
                  title={item.title}
                />
              ))}
            </div>
          )}

          <AssociationForm
            action={attachReportToClusterAction}
            clusterId={context.id}
            companyId={context.companyId}
            emptyLabel="Nenhum relato disponível para vincular"
            items={context.availableReports}
            name="report_id"
            returnTo={returnTo}
            submitLabel="Vincular relato"
            title="Selecionar relato"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Registros econômicos vinculados</h2>
            <p className="text-sm text-muted-foreground">
              O mesmo cluster pode concentrar sinais econômicos sem duplicar arquitetura.
            </p>
          </div>

          {context.linkedEconomicReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro econômico vinculado.
            </p>
          ) : (
            <div className="grid gap-3">
              {context.linkedEconomicReports.map((item) => (
                <LinkedItemCard
                  key={item.id}
                  action={detachEconomicReportFromClusterAction}
                  clusterId={context.id}
                  companyId={context.companyId}
                  href={item.href}
                  idField="economic_report_id"
                  itemId={item.id}
                  itemLabel={item.statusLabel}
                  itemMeta={[
                    item.unitName,
                    item.sectorName,
                    item.shiftName,
                    item.contractTypeLabel,
                    item.salaryBandLabel,
                    item.issueTypeLabel,
                  ]}
                  returnTo={returnTo}
                  summary={item.description}
                  title={item.title}
                />
              ))}
            </div>
          )}

          <AssociationForm
            action={attachEconomicReportToClusterAction}
            clusterId={context.id}
            companyId={context.companyId}
            emptyLabel="Nenhum registro econômico disponível para vincular"
            items={context.availableEconomicReports}
            name="economic_report_id"
            returnTo={returnTo}
            submitLabel="Vincular registro"
            title="Selecionar registro econômico"
          />
        </div>
      </section>

      {context.canViewModerationTrail ? (
        <ModerationAuditTrail
          currentUserId={currentUserId}
          description="Histórico interno de vínculos, revisões e arquivamentos deste cluster."
          emptyLabel="Nenhuma ação de moderação registrada para este cluster."
          events={context.moderationEvents}
          title="Trilha de auditoria"
        />
      ) : null}
    </div>
  );
}
