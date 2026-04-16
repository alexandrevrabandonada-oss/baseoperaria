# Base Operária

Estrutura inicial do produto Base Operária em Next.js, preparada para crescimento incremental sem antecipar funcionalidades.

## Visão do produto

Base Operária nasce aqui como uma fundação mobile-first para organizar áreas centrais do produto:

- Início
- Relatos
- Econômico
- Radar
- Pautas
- Núcleos

Nesta etapa, o projeto entrega apenas a casca inicial de navegação, layout e organização de código.

## Stack

- Next.js 16 com App Router
- React 19
- TypeScript estrito
- Tailwind CSS 4
- shadcn/ui
- Supabase Auth SSR

## Estrutura

```text
app/
components/
lib/
supabase/
types/
```

## Ambiente

### Requisitos

- Node.js 22+
- npm 10+

### Instalação

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha as variáveis do Supabase antes de rodar o projeto.

### Desenvolvimento

```bash
npm run dev
```

Aplicação disponível em [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Observações:

- Em produção, defina `NEXT_PUBLIC_SITE_URL` (ou `SITE_URL`) com o dominio publico, por exemplo `https://baseoperaria.seudominio.com`.
- Se `NEXT_PUBLIC_SITE_URL`/`SITE_URL` nao estiver definido, a aplicacao tenta usar `VERCEL_PROJECT_PRODUCTION_URL` ou `VERCEL_URL` automaticamente.
- Se nenhuma URL valida estiver disponivel em produção, o envio do magic link falha por seguranca (para nao gerar links com localhost).
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são usados no cliente browser e no SSR.
- O fluxo atual não exige `service_role` no runtime da aplicação.
- Mantenha chaves administrativas fora do frontend e fora de componentes client.
- O diagnóstico remoto usa `SUPABASE_DB_URL` ou `DATABASE_URL`, mas isso não deve ser carregado no runtime do app.

### Auth local com Supabase

Para o login por magic link funcionar localmente, configure no painel do Supabase:

- `Site URL`: `http://localhost:3000`
- `Redirect URL`: `http://localhost:3000/auth/confirm?next=/onboarding`

Se houver ambiente publicado, adicione tambem a variante real do dominio publicado na lista de redirects.
Em produção (Vercel), inclua tambem `https://SEU_DOMINIO/auth/confirm?next=/onboarding` nos Redirect URLs do Supabase e ajuste o Site URL para o mesmo dominio.

## Autenticação e onboarding

- Login por magic link em `/entrar`
- Callback de autenticação em `/auth/confirm`
- Logout em `/sair`
- Onboarding mínimo em `/onboarding`
- Sessão persistida com cookies via `proxy.ts`

## Módulo de relatos

- `/relatos`: entrada do módulo com atalhos e contexto da empresa
- `/relatos/novo`: formulário de relato de condições com anexos opcionais
- `/relatos/meus`: lista dos relatos enviados pelo próprio usuário
- `/relatos/[id]`: detalhe do relato, anexos e confirmações
- Confirmações suportadas: `acontece_tambem`, `acontece_direto`, `tenho_prova`, `urgente`

## Pauta Econômica

- `/economico`: entrada do módulo com atalhos e contexto da empresa
- `/economico/novo`: formulário econômico separado dos relatos de condições
- `/economico/meus`: lista dos registros econômicos criados pelo usuário
- `/economico/[id]`: detalhe do registro, confirmações e sinais agregados
- O fluxo prioriza faixa salarial em vez de valor salarial exato
- Os tipos iniciais de problema econômico ficam em `issue_types` e são filtrados na UI do módulo
- Os anexos econômicos ficam em tabela e bucket próprios para não misturar com relatos de condições

## Radar

- `/radar`: leitura coletiva privada do que já existe em relatos, registros econômicos, clusters e pautas
- O radar mostra contagens por categoria, setor e turno, além de recortes econômicos simples
- Não há pipeline novo, gráficos sofisticados nem processamento assíncrono adicional
- Quando houver mais de uma empresa vinculada, a leitura é sempre feita com seleção explícita de contexto

## Pautas

- `/pautas`: listagem operacional das pautas por empresa, com estado vazio e atalhos úteis
- `/pautas/nova?cluster_id=<id>`: criação de pauta a partir de um cluster já triado na área administrativa
- `/pautas/[id]`: detalhe da pauta com cluster de origem, sinais agregados, apoiadores e histórico básico
- O apoio é simples e autenticado; não há comentários livres, feed social nem votação complexa
- Moderadores criam pautas a partir de clusters, e usuários autenticados da empresa podem apoiar as pautas existentes

## Núcleos

- `/nucleos`: listagem funcional dos núcleos por empresa, com seleção de contexto e estados vazios
- `/nucleos/novo`: criação por moderador ou admin a partir de escopo por setor ou por tema
- `/nucleos/[id]`: detalhe com título, descrição, escopo, membros, pautas ligadas e encaminhamentos simples
- A adesão é controlada, restrita a membros autenticados da empresa, sem chat e sem comunidade aberta
- O núcleo organiza pessoas em torno de uma pauta e seus encaminhamentos, sem duplicar a camada de cluster

## Banco e RLS

- A ordem canônica das migrações é controlada por timestamp no nome do arquivo e validada pelo script `npm run supabase:sync-checklist`
- As migrações iniciais estão em `supabase/migrations/20260415150000_create_profiles.sql`, `supabase/migrations/20260415180000_init_schema.sql`, `supabase/migrations/20260415181000_init_rls.sql` e `supabase/migrations/20260415204000_governance_roles.sql`
- Os tipos TypeScript do banco vivem em `lib/supabase/types.ts` e são usados pelos clientes Supabase do app

## Administração mínima

- A área administrativa fica em `/admin` e é restrita a usuários com papel de `owner` ou `admin` em alguma empresa
- O chrome administrativo é separado da experiência comum do trabalhador e não aparece na navegação principal
- O painel usa cadastros de apoio simples, com arquivamento/desativação em vez de painel complexo

## Moderação mínima

- A área de moderação fica em `/moderacao` e é visível para usuários com papel de `moderator` ou `admin`
- Moderadores revisam relatos, registros econômicos e anexos, vinculam itens a clusters e podem arquivar ou sinalizar conteúdo
- Toda ação crítica da moderação grava um evento em `moderation_events`, que também aparece como trilha de auditoria nas telas internas
- O admin continua responsável pelos cadastros estruturais e pela criação de clusters; o moderador trabalha em cima do material já capturado

### Decisões de permissão

- `member`: cria relatos, registros econômicos, apoia pautas e participa dos núcleos
- `moderator`: revisa conteúdo, sinaliza, arquiva, associa itens a clusters e lê a trilha de auditoria
- `admin`: mantém cadastros estruturais, cria e edita clusters e também pode executar as ações de moderação

### Testes e hardening

- `npm run typecheck`, `npm run lint`, `npm run build` e `npm run test` validam o estado atual do projeto
- Os testes mínimos cobrem normalização e validação dos fluxos de onboarding, relatos, registros econômicos, confirmações e pautas
- O radar foi desenhado para ler somente dados já persistidos, com queries diretas e agregações em memória simples

### Como preparar uma empresa piloto

1. Acesse `/admin` com uma conta que já tenha acesso administrativo
2. Em `Empresas`, crie ou ajuste a empresa piloto
3. Em `Unidades`, cadastre as unidades da operação
4. Em `Setores`, associe os setores à empresa e, quando fizer sentido, a uma unidade
5. Em `Turnos`, cadastre os turnos com horários e indicação de virada de dia
6. Em `Categorias`, defina as categorias de relatos de condições e econômicos
7. Em `Clusters`, comece a agrupar relatos e registros econômicos manualmente quando a base já estiver ativa
8. Ainda em `Clusters`, use a ação `Criar pauta` para transformar um agrupamento relevante em pauta
9. Em `Núcleos`, crie grupos por setor ou por tema e adicione os membros que vão acompanhar a pauta
10. Depois abra `/moderacao` para revisar os primeiros relatos e registros econômicos
11. Só então use os formulários do app principal, que passam a encontrar os cadastros de apoio

Observações:

- `code` e `slug` são gerados automaticamente quando o campo fica vazio, mas podem ser informados manualmente se você quiser padronização explícita
- `company_id` é o eixo de isolamento dos cadastros; mantenha os dados da empresa piloto sempre nessa mesma empresa
- Arquivar ou desativar um cadastro mantém o histórico e evita apagar referências já usadas pelos relatos

### Guias internos do piloto

- `reports/guia-operacao-piloto.md`: roteiro operacional do piloto controlado
- `reports/checklist-uso-inicial-piloto.md`: checklist curto para abertura e uso inicial
- `reports/roteiro-smoke-piloto.md`: smoke funcional guiado para o fluxo critico do piloto
- `reports/supabase-bootstrap-checklist.md`: ordem técnica de bootstrap e validações rápidas

### Schema

- `profiles`: identidade mínima do app, com `pseudonym` e `initial_link`
- `companies` e `company_memberships`: base para multiempresa e papéis `owner`, `admin`, `moderator`, `member`, `observer`
- `units`, `sectors`, `shifts`: estrutura organizacional da empresa
- `report_categories`: taxonomia por empresa e por tipo de relato (`conditions` ou `economic`)
- `reports`, `report_attachments`, `report_confirmations`: fluxo de relatos de condições
- `economic_reports`, `economic_report_confirmations`, `economic_report_attachments`: fluxo separado de relatos econômicos
- `issue_clusters`, `cluster_reports`, `cluster_economic_reports`: consolidação e agrupamento de relatos e registros econômicos
- `demands`, `demand_supporters`: pautas, vínculo com cluster de origem e apoio autenticado
- `nuclei`, `nucleus_members`, `actions`, `moderation_events`: organização interna, ações e auditoria
- `severity_levels`, `frequency_levels`, `contract_types`, `salary_bands`, `issue_types`, `confirmation_types`: tabelas de apoio para classificação e confirmação

### Políticas

- Toda tabela com conteúdo de negócio está com RLS habilitado
- `profiles` só permite ler e alterar o próprio registro
- `companies` e cadastros estruturais ficam visíveis apenas a membros da empresa
- Tabelas de apoio só aceitam leitura autenticada
- Relatos, confirmações, anexos e demandas permitem escrita apenas para membros autenticados e, quando aplicável, com checagem de autor
- Papéis de governança separam `member` para uso comum, `moderator` para revisão e `admin` para administração estrutural
- Tabelas administrativas, como categorias, unidades, setores, turnos e clusters, exigem papel de `owner` ou `admin`
- `moderation_events` fica visível para `moderator` e `admin` e serve como trilha de auditoria nas telas internas
- O desenho permite expandir para múltiplas empresas sem refazer o modelo principal

### Clusters como ponte

- `issue_clusters` funciona como o agrupador manual do moderador
- `cluster_reports` vincula relatos de condições ao cluster
- `cluster_economic_reports` vincula registros econômicos ao mesmo cluster quando o tema é compartilhado
- Isso permite transformar sinais isolados em uma ponte operacional entre relato e pauta sem criar duas arquiteturas separadas

### Diferença entre cluster, pauta e núcleo

- `cluster` é a camada de triagem e agrupamento manual de sinais
- `pauta` é a demanda objetiva derivada de um cluster e pronta para acompanhamento
- `núcleo` é a camada organizativa de pessoas, usada para acompanhar pautas e gerar encaminhamentos
- Em resumo, o cluster agrega sinais, a pauta define o que precisa ser enfrentado e o núcleo organiza quem conduz esse trabalho

### Modelagem econômica

- `economic_reports` recebeu `formal_role` e `real_function` para registrar a diferença entre cargo formal e função real
- `economic_report_attachments` isola anexos econômicos de `report_attachments`
- `issue_types` segue como tabela única de apoio; os códigos econômicos iniciais foram adicionados por seed e filtrados na interface
- As confirmações usam `economic_report_confirmations` com deduplicação por `economic_report_id + profile_id`

## Sync remoto do Supabase

Processo recomendado para sincronizar o banco remoto com segurança:

1. Execute `npm run supabase:sync-checklist` para confirmar a ordem canônica das migrations e revisar o conjunto de arquivos.
2. Faça login no Supabase CLI com `supabase login`.
3. Vincule o projeto remoto com `supabase link --project-ref <project-ref>`.
4. Aplique as migrations com `supabase db push`.
5. Valide o banco remoto com `SUPABASE_DB_URL=<url-do-banco> npm run supabase:diagnose` ou `DATABASE_URL=<url-do-banco> npm run supabase:diagnose`.

O diagnóstico remoto confere:

- existência das tabelas principais
- RLS habilitado nas tabelas esperadas
- buckets privados esperados
- policies mínimas aplicadas

Se alguma checagem falhar, o script retorna código diferente de zero para bloquear a promoção silenciosa do ambiente.

## Próximos encaixes previstos

- Integração futura com Supabase usando `lib/` para clientes, helpers e contratos compartilhados
- Expansão das páginas sem romper a estrutura inicial
