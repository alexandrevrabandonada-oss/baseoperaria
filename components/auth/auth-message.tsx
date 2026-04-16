const statusCopy: Record<string, string> = {
  "dados-invalidos":
    "Revise os campos e use textos curtos e válidos nos dois campos.",
  "email-invalido": "Informe um e-mail válido para receber o magic link.",
  erro: "Não foi possível concluir a operação agora. Tente novamente.",
  "erro-envio": "Não foi possível enviar o link de acesso agora.",
  "link-enviado":
    "Se o e-mail existir ou puder ser criado, o link de acesso foi enviado.",
  "link-invalido": "O link de acesso expirou ou é inválido.",
  "sessao-encerrada": "Sua sessão foi encerrada com sucesso.",
};

type AuthMessageProps = {
  status?: string | undefined;
};

export function AuthMessage({ status }: AuthMessageProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
      {statusCopy[status]}
    </div>
  );
}
