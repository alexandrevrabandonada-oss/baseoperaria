import { StatusBanner } from "@/components/ui/status-banner";

const statusCopy: Record<
  string,
  {
    kind: "error" | "info" | "success" | "warning";
    message: string;
    title: string;
  }
> = {
  "dados-invalidos": {
    kind: "error",
    message: "Revise os dois campos e preencha do jeito mais curto e claro possível.",
    title: "Dados inválidos",
  },
  "email-invalido": {
    kind: "error",
    message: "Informe um e-mail válido para receber o magic link.",
    title: "E-mail inválido",
  },
  erro: {
    kind: "error",
    message: "Não conseguimos concluir a entrada agora. Tente de novo em instantes.",
    title: "Falha de autenticação",
  },
  "erro-envio": {
    kind: "error",
    message: "Não conseguimos enviar o link de entrada agora.",
    title: "Envio interrompido",
  },
  "link-enviado": {
    kind: "success",
    message: "Se esse e-mail puder entrar na base, o link foi enviado.",
    title: "Link enviado",
  },
  "link-invalido": {
    kind: "warning",
    message: "Esse link venceu ou não vale mais. Peça outro acesso.",
    title: "Link inválido",
  },
  "sessao-encerrada": {
    kind: "success",
    message: "Sua sessão foi encerrada com sucesso.",
    title: "Sessão encerrada",
  },
};

type AuthMessageProps = {
  status?: string | undefined;
};

export function AuthMessage({ status }: AuthMessageProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  const entry = statusCopy[status];

  return <StatusBanner kind={entry.kind} message={entry.message} title={entry.title} />;
}
