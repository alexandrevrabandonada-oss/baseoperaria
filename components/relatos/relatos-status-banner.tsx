type RelatosStatusBannerProps = {
  status?: string | undefined;
};

const statusCopy: Record<string, string> = {
  confirmado: "Sua confirmação foi registrada.",
  criado: "Relato criado com sucesso.",
  "criado-com-alerta":
    "Relato criado, mas alguns anexos falharam no envio. Você pode tentar de novo depois.",
  erro: "Não foi possível concluir a operação agora.",
  "sem-empresa":
    "Você ainda não está vinculado a nenhuma empresa para criar relatos.",
  "sem-relatos": "Nenhum relato encontrado.",
  "sem-vinculo":
    "Seu acesso ainda não foi associado a uma empresa. Aguarde o vínculo ou fale com a administração.",
};

export function RelatosStatusBanner({ status }: RelatosStatusBannerProps) {
  if (!status || !statusCopy[status]) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
      {statusCopy[status]}
    </div>
  );
}
