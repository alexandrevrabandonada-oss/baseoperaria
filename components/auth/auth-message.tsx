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
    message: "Preencha pseudônimo e vínculo com pelo menos 2 caracteres.",
    title: "Dados incompletos",
  },
  "email-invalido": {
    kind: "error",
    message: "Digite um e-mail válido para receber o link de entrada.",
    title: "E-mail inválido",
  },
  erro: {
    kind: "error",
    message: "A entrada falhou agora. Tente de novo em instantes.",
    title: "Falha na entrada",
  },
  "erro-envio": {
    kind: "error",
    message: "Nao deu para enviar o link agora. Tente de novo em instantes.",
    title: "Envio interrompido",
  },
  "erro-perfil": {
    kind: "error",
    message: "Nao deu para salvar seu cadastro agora. Tente outra vez.",
    title: "Falha no onboarding",
  },
  "callback-falhou": {
    kind: "warning",
    message: "Esse link venceu ou falhou. Peça outro acesso.",
    title: "Falha ao validar link",
  },
  "callback-sem-codigo": {
    kind: "warning",
    message: "O retorno veio quebrado. Peça um novo link de entrada.",
    title: "Retorno inválido",
  },
  "link-confirmado": {
    kind: "success",
    message: "Sua entrada foi confirmada. Falta so fechar o cadastro rapido abaixo.",
    title: "Entrada confirmada",
  },
  "link-enviado": {
    kind: "success",
    message: "Confira seu e-mail e abra o link para entrar na base.",
    title: "Link enviado",
  },
  "link-invalido": {
    kind: "warning",
    message: "Esse link venceu ou nao vale mais. Peça outro acesso.",
    title: "Link inválido",
  },
  "sessao-encerrada": {
    kind: "success",
    message: "Sua saida da base foi concluida.",
    title: "Sessão encerrada",
  },
  "sessao-expirada": {
    kind: "warning",
    message: "Sua sessao caiu. Entre de novo para continuar.",
    title: "Sessão expirada",
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
