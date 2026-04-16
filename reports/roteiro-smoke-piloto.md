# Roteiro de smoke funcional do piloto

Objetivo: validar, de ponta a ponta, o caminho critico do piloto com o menor custo operacional.

## Escopo do smoke

Fluxo alvo (na ordem):

1. Entrar com magic link
2. Concluir onboarding
3. Criar relato de condicoes
4. Criar relato economico
5. Anexar arquivo em pelo menos um dos fluxos
6. Confirmar relato com outra conta
7. Associar registros em um cluster
8. Criar pauta a partir do cluster
9. Conferir reflexo no radar

## Pre-condicoes

- Ambiente local com `SUPABASE_URL` e `SUPABASE_ANON_KEY` configurados
- Empresa piloto ja criada com cadastros basicos (`unidades`, `setores`, `turnos`, `categorias`)
- Duas contas de teste ativas na mesma empresa:
  - Conta A: perfil `member`
  - Conta B: perfil `member` (ou superior), diferente da conta A
- Bucket de anexos ativo e politicas de storage aplicadas

## Massa de dados sugerida

- Categoria de condicoes ativa
- Categoria economica ativa
- 1 setor e 1 turno ativos
- 1 unidade ativa (opcional, mas recomendado para consistencia)

## Passo a passo guiado

### 1) Magic link e sessao

- Acesse `/entrar` com a Conta A
- Solicite link e conclua autenticacao
- Resultado esperado:
  - Sessao criada sem erro
  - Redirecionamento para onboarding (se primeiro acesso) ou tela principal

### 2) Onboarding

- Preencha pseudonimo e vinculo inicial
- Salve
- Resultado esperado:
  - Perfil persistido
  - Navegacao para home sem erro de permissao

### 3) Criar relato de condicoes

- Acesse `/relatos/novo`
- Preencha campos obrigatorios e salve
- Resultado esperado:
  - Registro criado em `reports`
  - Item visivel na listagem de relatos

### 4) Criar relato economico

- Acesse `/economico/novo`
- Preencha campos obrigatorios e salve
- Resultado esperado:
  - Registro criado em `economic_reports`
  - Item visivel na listagem economica

### 5) Upload de anexo

- Em um relato criado, envie um arquivo pequeno (imagem ou PDF)
- Resultado esperado:
  - Upload concluido sem erro
  - Metadado do anexo persistido
  - Arquivo recuperavel na visualizacao do relato

### 6) Confirmacao por outra conta

- Encerrar sessao da Conta A
- Entrar com a Conta B
- Abrir o relato da Conta A e confirmar com tipo valido
- Resultado esperado:
  - Confirmacao criada
  - Contador/estado de confirmacoes atualizado na tela

### 7) Clusterizacao (admin)

- Acesse `/admin/clusters` com conta autorizada
- Crie ou edite cluster
- Associe ao menos 1 `report` e 1 `economic_report`
- Resultado esperado:
  - Viculos persistidos em `cluster_reports` e `cluster_economic_reports`
  - Cluster aparece com escopo misto

### 8) Criar pauta a partir do cluster

- Na tela de clusters, use a acao `Criar pauta`
- Preencha titulo, descricao, prioridade e status
- Resultado esperado:
  - Registro criado em `demands`
  - `cluster_id` preenchido na pauta criada
  - Navegacao para detalhe/lista de pautas sem erro

### 9) Validacao no radar

- Acesse `/radar` na mesma empresa
- Resultado esperado:
  - Cluster novo aparecendo em destaque quando houver vinculos
  - Pauta criada aparecendo em prioridades quando status ativo
  - Sem erro de autenticacao/permissao na carga

## Cobertura automatica x validacao humana

Coberto automaticamente neste repositorio:

- Contratos de validacao do fluxo critico em `tests/pilot-smoke.test.ts`
- Fluxo de criacao de pauta a partir de cluster em `tests/pauta-action-smoke.test.ts`
- Criacao/edicao de cluster, tratamento de duplicidade, fallback de erro e sem-permissao em `tests/cluster-save-smoke.test.ts`
- Associacao de relatos e economicos em cluster em `tests/cluster-attach-report-smoke.test.ts` e `tests/cluster-attach-smoke.test.ts`
- Remocao de associacoes (detach) para relatos e economicos em `tests/cluster-detach-smoke.test.ts`
- Fallback de erro de banco (`status=erro`) nas actions de attach/detach em `tests/cluster-action-error-smoke.test.ts`
- Parsers de onboarding, relato, economico, confirmacao e pauta
- Guarda de `return_to` para navegacao segura entre clusters e pautas

Depende de validacao humana (smoke manual acima):

- Magic link real e ciclo de sessao no navegador
- Upload real para storage e leitura posterior do anexo
- Persistencia real no banco com RLS e permissao por papel
- Reflexo agregado no radar apos associacoes e criacao de pauta

## Criterio de aprovacao para o piloto

- Todos os 9 passos executados sem erro bloqueante
- Pelo menos 1 evidencia por etapa (print, id de registro ou anotacao de timestamp)
- Se houver falha, registrar etapa, conta usada, horario e mensagem de erro antes de corrigir