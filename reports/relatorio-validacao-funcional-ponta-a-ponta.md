# Relatorio de Validacao Funcional Ponta a Ponta

Data: 15/04/2026
Escopo: login, callback, onboarding, captura e upload com Supabase remoto

## 1) Fluxo revisado

### /entrar

- Formulario envia email para magic link via `signInWithMagicLinkAction`
- Status exibidos por `AuthMessage`
- Se ja houver sessao, rota redireciona para `/` ou `/onboarding`

### /auth/confirm

- Recebe `code` da URL e executa `exchangeCodeForSession`
- Redireciona para `next` apenas com caminho interno normalizado
- Se callback vier sem `code`, redireciona com status explicito
- Falhas no exchange ficam registradas em log e retornam status explicito

### /onboarding

- Exige sessao ativa
- Persiste `pseudonym` e `initial_link` em `profiles` via upsert
- Falhas de sessao/perfil foram endurecidas com status e logs

### /relatos/novo

- Exige sessao ativa
- Valida membership, unidade, setor, turno, categoria, severidade e frequencia
- Cria relato e tenta subir anexos para `report-attachments`
- Em falha de metadados de anexos, executa limpeza de storage e registra log

### /economico/novo

- Exige sessao ativa
- Valida membership, estrutura organizacional e lookups economicos
- Cria registro e tenta subir anexos para `economic-report-attachments`
- Em falha de metadados de anexos, executa limpeza de storage e registra log

## 2) Endurecimentos aplicados nesta rodada

Arquivos alterados:

- app/auth/actions.ts
- app/auth/confirm/route.ts
- lib/supabase/proxy.ts
- lib/supabase/queries.ts
- components/auth/auth-message.tsx
- app/relatos/actions.ts
- app/economico/actions.ts
- app/relatos/novo/page.tsx
- app/economico/novo/page.tsx
- app/onboarding/page.tsx

Melhorias:

1. Callback de auth mais robusto
- tratamento de callback sem `code`
- normalizacao de `next` para evitar redirecionamento invalido/externo
- logs de falha no exchange

2. Sessao e onboarding mais confiaveis
- status explicito para sessao expirada
- log de falha ao recuperar sessao
- log de falha ao persistir `profiles`

3. Upload com melhor observabilidade
- logs de anexo rejeitado por tamanho
- logs de falha de upload
- logs de falha no insert de metadados
- limpeza de arquivos enviados com log em caso de erro

4. Novo status de UX para auth
- `callback-sem-codigo`
- `callback-falhou`
- `sessao-expirada`
- `erro-perfil`

## 3) Checklist operacional de validacao manual

Pre-condicoes:

- `.env.local` configurado com URL e anon key corretas
- Supabase Auth com:
  - Site URL: `http://localhost:3000`
  - Redirect URL: `http://localhost:3000/auth/confirm?next=/onboarding`
- SQL de bootstrap ja aplicado com sucesso

### A. Login e callback

1. Acessar `/entrar`
2. Enviar magic link com email valido
3. Abrir link recebido
4. Validar que callback em `/auth/confirm` redireciona para `/onboarding`
5. Testar callback invalido sem `code` e validar banner adequado em `/entrar`

Criterio de aprovacao:

- Login conclui sem erro tecnico
- Falhas exibem mensagem util ao usuario
- Falhas de callback geram log no servidor

### B. Primeira entrada e perfil

1. No primeiro login, confirmar redirecionamento automatico para `/onboarding`
2. Preencher pseudonimo e vinculo inicial
3. Submeter e validar redirecionamento para `/`
4. Confirmar registro em `profiles` (id do usuario, pseudonym, initial_link)

Criterio de aprovacao:

- Persistencia em `profiles` ocorre na primeira tentativa
- Em falha, status de erro aparece e log server e gerado

### C. Sessao por cookie

1. Navegar entre `/`, `/relatos`, `/economico`, `/onboarding`
2. Confirmar manutencao de sessao sem pedir novo login
3. Simular sessao expirada e validar redirecionamento para `/entrar?status=sessao-expirada`

Criterio de aprovacao:

- Sessao permanece valida durante navegacao normal
- Expiracao redireciona com mensagem adequada

### D. Criacao de relato com anexos

1. Ir para `/relatos/novo`
2. Criar relato sem anexo
3. Criar relato com 1 anexo valido
4. Criar relato com 1 anexo acima de 10MB
5. Validar status final no detalhe

Criterio de aprovacao:

- Relato e criado com dados validos
- Fluxo com anexo invalido nao quebra o relato
- Status de alerta aparece quando houver falha parcial de anexo

### E. Criacao de registro economico com anexos

1. Ir para `/economico/novo`
2. Criar registro sem anexo
3. Criar registro com anexo valido
4. Criar registro com anexo acima de 10MB
5. Validar status final no detalhe

Criterio de aprovacao:

- Registro economico e criado corretamente
- Falha parcial de anexo nao interrompe o registro
- Mensagem de alerta aparece quando necessario

### F. Integridade basica de upload

1. Verificar buckets:
- `report-attachments`
- `economic-report-attachments`
2. Validar caminho dos arquivos no padrao `<company_id>/<report_id>/<uuid>-<filename>`
3. Em falha simulada de metadado, verificar se limpeza foi tentada e logada

Criterio de aprovacao:

- Uploads validos aparecem no bucket esperado
- Logs de cleanup aparecem em caso de falha de persistencia

## 4) Resultado esperado ao final da rodada

- Fluxos criticos validados manualmente sem bloqueios
- Erros de auth/callback/session com feedback claro para usuario
- Falhas de upload com observabilidade suficiente para diagnostico rapido
- Sem mudanca de arquitetura e sem novas features
