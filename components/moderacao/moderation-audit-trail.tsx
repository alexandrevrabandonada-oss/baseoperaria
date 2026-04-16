import type { ModerationTrailItem } from "@/lib/supabase/moderation";

type ModerationAuditTrailProps = {
  currentUserId?: string | null | undefined;
  description: string;
  emptyLabel: string;
  events: ModerationTrailItem[];
  title: string;
};

function stringifyDetailValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function formatDetails(details: ModerationTrailItem["details"]) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }

  return Object.entries(details)
    .map(([key, value]) => {
      const normalized = stringifyDetailValue(value);
      return normalized ? `${key}: ${normalized}` : null;
    })
    .filter((value): value is string => Boolean(value));
}

export function ModerationAuditTrail({
  currentUserId,
  description,
  emptyLabel,
  events,
  title,
}: ModerationAuditTrailProps) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => {
              const details = formatDetails(event.details);
              const actorLabel =
                currentUserId && event.actorProfileId === currentUserId ? "Você" : "Perfil da base";

              return (
                <article key={event.id} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-1 font-medium">
                        {event.entityLabel}
                      </span>
                      <span className="rounded-full border px-2 py-1 font-medium">
                        {event.actionLabel}
                      </span>
                      <span>{actorLabel}</span>
                    </div>

                    <p className="text-sm font-medium">{event.reason ?? "Sem motivo registrado na ação"}</p>

                    {details.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {details.map((detail) => (
                          <span key={detail} className="rounded-full border px-2 py-1">
                            {detail}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.createdAt))}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
