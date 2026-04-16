import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { PautaDetailContext } from "@/lib/supabase/pautas";
import { cn } from "@/lib/utils";
import { PautaSupportForm } from "@/components/pautas/pauta-support-form";
import { labelPautaKind, labelPautaStatus } from "@/types/pautas";

type PautaDetailViewProps = {
  context: PautaDetailContext;
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

export function PautaDetailView({ context, status }: PautaDetailViewProps) {
  const returnTo = `/pautas?company_id=${context.companyId}`;
  const demandStatusLabel = labelPautaStatus(context.status);
  const demandKindLabel = labelPautaKind(context.kind);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(context.createdAt));

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
            <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
              Voltar para pautas
            </Link>
          </div>

          {context.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{context.description}</p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Sem texto registrado para essa pauta.</p>
          )}

          <p className="text-xs text-muted-foreground">Criada em {dateLabel}</p>
        </div>
      </section>

      {status ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {status}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Tipo" value={demandKindLabel} />
        <DetailRow label="Prioridade" value={context.priorityLabel} />
        <DetailRow label="Status" value={demandStatusLabel} />
        <DetailRow label="Unidade" value={context.unitName} />
        <DetailRow label="Setor" value={context.sectorName} />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Cluster de origem</h2>
          {context.cluster ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">{context.cluster.title}</p>
              {context.cluster.summary ? (
                <p className="text-sm leading-6 text-muted-foreground">{context.cluster.summary}</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <SignalCard
                  label="Escopo"
                  value={context.cluster.scopeLabel}
                  hint="Classificação do cluster de origem."
                />
                <SignalCard
                  label="Vínculos do cluster"
                  value={String(context.cluster.reportLinkCount + context.cluster.economicLinkCount)}
                  hint="Soma dos vínculos de condições de trabalho e pauta econômica."
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum cluster de origem foi vinculado.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Sinais agregados</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SignalCard
              label="Apoios"
              value={String(context.supportCount)}
              hint="Apoios simples de membros autenticados."
            />
            <SignalCard
              label="Atualização"
              value={new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(context.updatedAt))}
              hint="Última alteração da pauta."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Apoiadores</h2>
            <p className="text-sm text-muted-foreground">
              Sem comentário livre e sem votação complexa. Só apoio direto de quem está autenticado.
            </p>
          </div>

          {context.isCreator ? (
            <p className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
              O autor da pauta não registra apoio próprio.
            </p>
          ) : (
            <PautaSupportForm
              companyId={context.companyId}
              demandId={context.id}
              isSupportedByMe={context.isSupportedByMe}
              returnTo={`/pautas/${context.id}`}
            />
          )}

          <div className="rounded-xl border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Apoios registrados
            </p>
            <p className="mt-1 text-lg font-semibold">{context.supportCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Histórico básico</h2>
            <p className="text-sm text-muted-foreground">
              O histórico fica preso ao que foi feito e quando foi feito.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {context.history.map((entry) => (
              <article key={`${entry.label}-${entry.createdAt}`} className="rounded-xl border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(entry.createdAt))}
                </p>
                {entry.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Público e escopo</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Empresa" value={context.companyName} />
            <DetailRow label="Criador" value={context.isCreator ? "Você" : "Outro membro"} />
          </div>
        </div>
      </section>
    </div>
  );
}
