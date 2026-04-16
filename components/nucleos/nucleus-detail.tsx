import Link from "next/link";

import { NucleusActionForm } from "@/components/nucleos/nucleus-action-form";
import { NucleusMemberForm } from "@/components/nucleos/nucleus-member-form";
import { NucleusMembershipToggleForm } from "@/components/nucleos/nucleus-membership-toggle-form";
import { NucleosStatusBanner } from "@/components/nucleos/nucleos-status-banner";
import { buttonVariants } from "@/components/ui/button";
import type { NucleusDetailContext } from "@/lib/supabase/nucleos";
import { cn } from "@/lib/utils";
import {
  labelNucleusActionStatus,
  labelNucleusActionType,
  labelNucleusMemberRole,
} from "@/types/nucleos";

type NucleusDetailViewProps = {
  context: NucleusDetailContext;
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

function SectionHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function memberRoleLabel(role: string) {
  return labelNucleusMemberRole(role as Parameters<typeof labelNucleusMemberRole>[0]);
}

function actionStatusLabel(status: string) {
  return labelNucleusActionStatus(status as Parameters<typeof labelNucleusActionStatus>[0]);
}

function actionTypeLabel(actionType: string) {
  return labelNucleusActionType(actionType as Parameters<typeof labelNucleusActionType>[0]);
}

export function NucleusDetailView({ context, status }: NucleusDetailViewProps) {
  const returnTo = `/nucleos?company_id=${context.companyId}`;
  const canManage = context.companyRole === "owner" || context.companyRole === "admin";
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
            <Link href={returnTo} className={cn(buttonVariants({ variant: "outline" }))}>
              Voltar para núcleos
            </Link>
          </div>

          {context.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{context.description}</p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Sem resumo registrado para esse núcleo.</p>
          )}

          <p className="text-xs text-muted-foreground">
            Criado em {dateLabel} · Atualizado em {updatedLabel}
          </p>
        </div>
      </section>

      <NucleosStatusBanner status={status} />

      <section className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Escopo" value={context.scopeLabel} />
        <DetailRow label="Status" value={context.statusLabel} />
        <DetailRow label="Membros" value={String(context.memberCount)} />
        <DetailRow label="Pautas ligadas" value={String(context.linkedDemands.length)} />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Adesão"
            description="A participação é controlada e restrita a membros autenticados da empresa."
          />

          {context.status === "archived" ? (
            <p className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
              Núcleo arquivado não aceita novas adesões.
            </p>
          ) : (
            <NucleusMembershipToggleForm
              companyId={context.companyId}
              isMember={context.isMember}
              nucleusId={context.id}
              returnTo={`/nucleos/${context.id}`}
            />
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Membros"
            description="Pessoas vinculadas ao núcleo e seus papéis operacionais."
          />

          <div className="grid gap-3">
            {context.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro vinculado ainda.</p>
            ) : (
              context.members.map((member) => (
                <article key={member.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm font-medium">
                        {member.pseudonym}
                        {member.isCurrentUser ? " · você" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {memberRoleLabel(member.role)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {canManage ? (
            <div className="rounded-2xl border bg-background p-4">
              <NucleusMemberForm
                companyId={context.companyId}
                nucleusId={context.id}
                memberOptions={context.availableMemberOptions}
                returnTo={`/nucleos/${context.id}`}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Pautas ligadas"
            description="A ponte entre núcleo e pauta continua manual, sem automatização ou IA."
          />

          {context.linkedDemands.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pauta ligada a este núcleo.</p>
          ) : (
            <div className="grid gap-3">
              {context.linkedDemands.map((demand) => (
                <article key={demand.id} className="rounded-xl border bg-background p-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-medium">{demand.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {demand.statusLabel} · {demand.actionCount} encaminhamentos
                        </p>
                      </div>
                      <Link
                        href={demand.href}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Encaminhamentos simples"
            description="Ações diretas para tocar o núcleo sem comentário solto nem feed."
          />

          {canManage ? (
            <div className="rounded-2xl border bg-background p-4">
              <NucleusActionForm
                companyId={context.companyId}
                demandOptions={context.availableDemandOptions}
                nucleusId={context.id}
                returnTo={`/nucleos/${context.id}`}
              />
            </div>
          ) : null}

          <div className="grid gap-3">
            {context.actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum encaminhamento registrado ainda.</p>
            ) : (
              context.actions.map((action) => {
                const actionDate = new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(action.createdAt));

                return (
                  <article key={action.id} className="rounded-xl border bg-background p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="text-sm font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {actionTypeLabel(action.actionType)}
                          </p>
                        </div>
                        <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                          {actionDate}
                        </span>
                      </div>

                      {action.details ? (
                        <p className="text-sm leading-6 text-muted-foreground">{action.details}</p>
                      ) : null}

                      <div className="grid gap-2 md:grid-cols-2">
                        <SignalCard
                          label="Pauta"
                          value={action.demandTitle ?? "Sem pauta"}
                          hint={action.demandHref ? "Encaminhamento ligado a pauta." : "Sem vínculo de pauta."}
                        />
                        <SignalCard
                          label="Estado"
                          value={actionStatusLabel(action.status)}
                          hint="Situação atual do encaminhamento."
                        />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3">
          <SectionHeader
            title="Histórico básico"
            description="O histórico fica restrito a timestamps do sistema e ao estado atual do núcleo."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Criado por" value={context.createdByCurrentUser ? "Você" : "Outro membro"} />
            <DetailRow label="Atualização" value={updatedLabel} />
          </div>
        </div>
      </section>
    </div>
  );
}
