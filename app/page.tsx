import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAuthContext, hasCompletedOnboarding } from "@/lib/supabase/queries";

const trustItems = [
  {
    description: "Você pode entrar e começar a registrar sem expor identidade civil na base.",
    title: "Sem nome real obrigatório",
  },
  {
    description: "Cada empresa enxerga só o próprio espaço. O acesso é fechado e controlado.",
    title: "Acesso privado por empresa",
  },
  {
    description: "Condições de trabalho, pauta econômica e organização no mesmo circuito.",
    title: "Relatos, pauta econômica e organização",
  },
  {
    description: "O foco é transformar sinal disperso em prova, prioridade e ação coletiva.",
    title: "Prova, prioridade e ação",
  },
] as const;

const flowSteps = [
  {
    description: "O trabalhador registra o problema com texto curto, contexto e prova quando existir.",
    title: "Relato",
  },
  {
    description: "Outras pessoas do mesmo chão confirmam recorrência, urgência e consistência.",
    title: "Confirmação",
  },
  {
    description: "A moderação agrupa sinais parecidos e monta leitura concreta do problema.",
    title: "Cluster",
  },
  {
    description: "O problema sai do isolamento e vira pauta objetiva com prioridade e pressão.",
    title: "Pauta",
  },
  {
    description: "A base se organiza por setor, tema ou frente para acompanhar o enfrentamento.",
    title: "Núcleo",
  },
  {
    description: "O registro alimenta encaminhamento real: cobrança, organização e memória coletiva.",
    title: "Ação",
  },
] as const;

const centralAxes = [
  {
    description:
      "Assédio, ritmo, equipamento, escala, risco, chefia, setor e turno. O que pesa no corpo e no cotidiano entra aqui com material para prova e confirmação.",
    kicker: "Eixo 01",
    tone: "primary",
    title: "Condições de trabalho",
  },
  {
    description:
      "Salário, desconto, desvio de função, vínculo, meta, calote e quebra de acordo. A pauta econômica entra sem maquiagem e com leitura de prioridade.",
    kicker: "Eixo 02",
    tone: "accent",
    title: "Pauta econômica",
  },
] as const;

const modules = [
  {
    description: "Entrada rápida para registrar situação, anexar prova e marcar contexto de base.",
    title: "Relatos",
  },
  {
    description: "Canal próprio para salário, desconto, vínculo e outros problemas que batem no bolso.",
    title: "Econômico",
  },
  {
    description: "Leitura reservada do que está se repetindo por categoria, setor, turno e empresa.",
    title: "Radar",
  },
  {
    description: "Pautas que saem do agrupamento e viram reivindicação clara, acompanhável e priorizada.",
    title: "Pautas",
  },
  {
    description: "Núcleos para reunir gente, dividir responsabilidade e puxar encaminhamento real.",
    title: "Núcleos",
  },
] as const;

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:gap-4">
      <p className="section-kicker">
        {eyebrow}
      </p>
      <h2 className="section-title max-w-3xl">
        {title}
      </h2>
      <p className="section-copy">
        {description}
      </p>
    </header>
  );
}

export default async function HomePage() {
  const auth = await getAuthContext();
  const canEnter = Boolean(auth.user);
  const primaryHref = canEnter
    ? hasCompletedOnboarding(auth)
      ? "/relatos"
      : "/onboarding"
    : "/entrar";
  const primaryLabel = canEnter
    ? hasCompletedOnboarding(auth)
      ? "Abrir Base"
      : "Continuar entrada"
    : "Entrar";
  const finalCtaLabel = canEnter ? "Abrir Base" : "Entrar na Base";

  return (
    <div className="page-stack gap-6 sm:gap-7">
      <section className="surface-hero">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(242,195,0,0.14)_0%,transparent_34%,transparent_64%,rgba(180,83,9,0.12)_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] border-l border-border/35 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.018)_0_1px,transparent_1px_34px)] xl:block" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.68fr)] xl:gap-7">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="w-fit rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary">
              Infraestrutura privada de base
            </div>

            <header className="flex flex-col gap-3 sm:gap-4">
              <p className="section-label">
                Para trabalhador, setor, turno e coletivo
              </p>
              <h1 className="max-w-4xl text-4xl font-bold uppercase leading-[0.92] tracking-[0.04em] text-foreground sm:text-5xl xl:text-6xl">
                Escutar. <span className="text-primary">Provar.</span> Organizar.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.02rem] sm:leading-8">
                Infraestrutura privada para transformar problemas isolados em pauta coletiva.
              </p>
            </header>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="surface-subtle px-4 py-3">
                <p className="section-label text-primary/85">
                  Para quem existe
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Para trabalhador que precisa registrar, confirmar e não ficar sozinho com o problema.
                </p>
              </div>
              <div className="surface-subtle px-4 py-3">
                <p className="section-label text-primary/85">
                  O que faz
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Junta relato, prova, leitura coletiva, pauta e organização em um circuito só.
                </p>
              </div>
              <div className="surface-subtle px-4 py-3">
                <p className="section-label text-primary/85">
                  Primeiro passo
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Entrar por acesso privado e começar pelo relato do que está pegando na base.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                {primaryLabel}
              </Link>
              <Link
                href="#como-funciona"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                Como funciona
              </Link>
            </div>
          </div>

          <aside className="surface-subtle relative flex flex-col justify-between gap-4 p-5 xl:mt-1">
            <div className="space-y-3">
              <p className="section-kicker">
                Base protegida
              </p>
              <h2 className="text-2xl font-bold uppercase tracking-[0.04em] text-foreground sm:text-[2rem]">
                Privado, direto e útil.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                O projeto existe para dar forma ao que costuma ser abafado: problema recorrente,
                reivindicação concreta e organização por base.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="section-label text-primary">
                  Privacidade
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Sem exposição desnecessária e com escopo fechado por empresa.
                </p>
              </div>
              <div className="rounded-lg border border-accent/35 bg-accent/10 px-4 py-3">
                <p className="section-label text-accent">
                  Confiança
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  O registro não some em caixa vazia: ele alimenta leitura, pauta e ação.
                </p>
              </div>
              <div className="surface-subtle rounded-lg px-4 py-3">
                <p className="section-label text-primary/85">
                  Método
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Relatar, confirmar, agrupar, priorizar e organizar o coletivo em cima do que pesa.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="surface-subtle sm:px-6 sm:py-6">
        <SectionHeader
          eyebrow="Confiança"
          title="Proteção para registrar o que importa"
          description="A home precisa deixar claro por que essa base existe: proteger o registro, organizar o acúmulo e dar utilidade coletiva ao que hoje costuma ficar disperso."
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {trustItems.map((item) => (
            <article key={item.title} className="rounded-xl border border-border/75 bg-background/68 px-4 py-4">
              <div className="h-2 w-16 bg-primary" />
              <h3 className="mt-4 text-lg font-bold uppercase tracking-[0.04em] text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="surface-panel">
        <SectionHeader
          eyebrow="Como funciona"
          title="Do sinal isolado ao movimento organizado"
          description="O fluxo é simples de entender no celular e firme o bastante para virar instrumento de base. Sem floreio, sem painel decorativo."
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {flowSteps.map((step, index) => (
            <article key={step.title} className="relative rounded-xl border border-border/75 bg-background/62 px-4 py-4 2xl:min-h-64">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-primary/40 bg-primary/12 text-sm font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-base font-bold uppercase tracking-[0.04em] text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              {index < flowSteps.length - 1 ? (
                <div className="mt-5 h-px w-full bg-gradient-to-r from-primary/60 via-border to-transparent 2xl:absolute 2xl:bottom-4 2xl:left-[calc(100%-0.5rem)] 2xl:top-5 2xl:mt-0 2xl:h-0.5 2xl:w-6" />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel">
        <SectionHeader
          eyebrow="Dois eixos centrais"
          title="O que a base precisa registrar sem misturar tudo"
          description="A estrutura separa dois campos centrais para dar clareza à leitura e à organização: o que pesa nas condições de trabalho e o que pesa no bolso e no vínculo."
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {centralAxes.map((axis) => (
            <article
              key={axis.title}
              className={cn(
                "rounded-2xl border px-5 py-5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.02)]",
                axis.tone === "primary"
                  ? "border-primary/35 bg-primary/10"
                  : "border-accent/35 bg-accent/10",
              )}
            >
              <p
                className={cn(
                  "text-[0.72rem] font-semibold uppercase tracking-[0.24em]",
                  axis.tone === "primary" ? "text-primary" : "text-accent",
                )}
              >
                {axis.kicker}
              </p>
              <h3 className="mt-3 text-2xl font-bold uppercase tracking-[0.04em] text-foreground">
                {axis.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-foreground/88">{axis.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-subtle sm:px-6 sm:py-6">
        <SectionHeader
          eyebrow="Módulos"
          title="Cada parte da base tem função clara"
          description="A home precisa mostrar utilidade concreta. Estes módulos existem para captar, ler, priorizar e organizar, não para encher tela."
        />

        <div className="mt-5 grid gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {modules.map((module) => (
            <article key={module.title} className="rounded-xl border border-border/75 bg-background/66 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold uppercase tracking-[0.04em] text-foreground">
                  {module.title}
                </h3>
                <div className="size-3 bg-primary" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-hero">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-4">
            <p className="section-kicker">
              Fechamento
            </p>
            <h2 className="max-w-3xl text-3xl font-bold uppercase tracking-[0.04em] text-foreground sm:text-4xl">
              Do sofrimento disperso à organização coletiva.
            </h2>
            <p className="section-copy max-w-2xl sm:text-base">
              A Base Operária existe para que problema repetido não fique enterrado no isolamento.
              O primeiro passo é entrar, registrar e começar a construir prova e pauta com segurança.
            </p>
          </div>

          <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "w-full lg:w-auto")}>
            {finalCtaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
