# Relatório de Estado Atual do Projeto

Data de referência: 15/04/2026

## Visão Geral

O `Base Operária` está em um estágio funcional de produto, com Next.js App Router, TypeScript estrito, Tailwind CSS e shadcn/ui já integrados. A aplicação deixou de ser apenas uma casca inicial e hoje cobre autenticação, onboarding, cadastros estruturais, moderação, clustering, pautas, núcleos, relatos, pauta econômica e radar privado.

A base foi pensada para operar com Supabase remoto em SSR, usando cookies para persistência de sessão e uma modelagem preparada para RLS, multiempresa e expansão futura sem exigir reestruturação grande.

## Stack

- Next.js 16.2.3 com App Router
- React 19.2.4
- TypeScript estrito
- Tailwind CSS 4
- shadcn/ui
- Supabase via `@supabase/ssr` e `@supabase/supabase-js`
- Vitest para validações mínimas de fluxo

## Estrutura Atual

O código está organizado em:

- `app/`
- `components/`
- `lib/`
- `supabase/`
- `tests/`
- `types/`
- `reports/`

O layout principal usa `AppShell`, com header simples no desktop, navegação inferior no mobile e separação visual entre experiência comum, área administrativa e área de moderação.

## Rotas Entregues

### Base e acesso

- `/` página inicial
- `/entrar` login por magic link
- `/auth/confirm` confirmação do link
- `/onboarding` cadastro mínimo com pseudônimo e vínculo inicial
- `/sair` encerramento de sessão

### Relatos

- `/relatos`
- `/relatos/novo`
- `/relatos/meus`
- `/relatos/[id]`

### Pauta Econômica

- `/economico`
- `/economico/novo`
- `/economico/meus`
- `/economico/[id]`

### Pautas

- `/pautas`
- `/pautas/nova?cluster_id=<id>`
- `/pautas/[id]`

### Núcleos

- `/nucleos`
- `/nucleos/novo`
- `/nucleos/[id]`

### Administração e moderação

- `/admin`
- `/admin/[section]`
- `/admin/clusters`
- `/admin/clusters/[id]`
- `/moderacao`

### Radar

- `/radar`

## Estado dos Módulos

### Autenticação e onboarding

O login é por magic link e a sessão é persistida por cookies no fluxo SSR. O onboarding coleta apenas:

- pseudônimo
- vínculo inicial simples

Não há coleta de nome real, CPF, matrícula ou outro dado sensível desnecessário.

### Relatos

O módulo de relatos está funcional e separado do fluxo econômico. Ele cobre:

- criação de relato de condições
- anexos opcionais
- listagem “Meus relatos”
- detalhe do relato
- confirmações autenticadas com deduplicação por usuário

### Pauta Econômica

O fluxo econômico é separado dos relatos de condições e prioriza:

- tipo de vínculo
- cargo formal
- função real
- faixa salarial em vez de salário exato
- tipo de problema econômico
- anexos opcionais

Também há listagem “Meus registros econômicos”, detalhe e confirmações autenticadas.

### Clusters

`issue_clusters` virou a camada manual de triagem. Moderadores e admins associam:

- relatos de condições
- registros econômicos

Isso funciona como ponte entre sinal disperso e pauta objetiva, sem IA e sem duplicar arquitetura.

### Pautas

As pautas nasceram a partir de clusters e hoje têm:

- título
- texto objetivo
- tipo
- prioridade
- status
- vínculo com empresa/unidade/setor quando aplicável
- apoio autenticado de usuários da empresa
- detalhe com cluster de origem, apoiadores e histórico básico

### Núcleos

Os núcleos funcionam como camada enxuta de organização:

- criação por moderador ou admin
- escopo por setor ou tema
- adesão controlada por membros autenticados
- detalhe com membros, pautas ligadas e encaminhamentos simples

Não existe chat nem comunidade aberta.

### Administração mínima

`/admin` mantém os cadastros estruturais da empresa piloto:

- empresas
- unidades
- setores
- turnos
- categorias

A interface é simples, mobile-first e sem painel burocrático.

### Moderação mínima

`/moderacao` concentra a revisão inicial:

- relatos
- registros econômicos
- anexos
- associação a clusters
- sinalização
- arquivamento

Todas as ações críticas gravam `moderation_events`, que também aparecem como trilha de auditoria em telas internas.

### Radar

`/radar` agora é uma leitura coletiva privada do que já existe. Ele mostra:

- contagem por categoria
- contagem por setor
- contagem por turno
- recortes econômicos simples
- clusters mais relevantes
- pautas prioritárias

O radar só lê dados persistidos e agrega em memória. Não há pipeline novo nem analytics sofisticado.

## Banco e RLS

O schema remoto do Supabase está estruturado com:

- `profiles`
- `companies`
- `company_memberships`
- `units`
- `sectors`
- `shifts`
- `report_categories`
- `reports`
- `report_attachments`
- `report_confirmations`
- `economic_reports`
- `economic_report_confirmations`
- `economic_report_attachments`
- `issue_clusters`
- `cluster_reports`
- `cluster_economic_reports`
- `demands`
- `demand_supporters`
- `nuclei`
- `nucleus_members`
- `actions`
- `moderation_events`

Tabelas de apoio:

- `severity_levels`
- `frequency_levels`
- `contract_types`
- `salary_bands`
- `issue_types`
- `confirmation_types`

RLS está habilitado em todas as tabelas de negócio. A política segue estes princípios:

- leitura e escrita sempre restringidas por empresa
- `member` para uso comum
- `moderator` para revisão e moderação
- `admin` para administração estrutural
- `moderation_events` visível para `moderator` e `admin`
- sem `service_role` no runtime do app

## Qualidade e Hardening

Foi adicionada uma camada mínima de validação e teste para reduzir risco em fluxos críticos:

- parsers compartilhados em `lib/validation/workflows.ts`
- testes mínimos em `tests/workflows.test.ts`
- runner `Vitest` no `package.json`

Os fluxos cobertos pelos testes são:

- auth/onboarding
- criação de relato
- criação de registro econômico
- confirmação
- criação de pauta

## Validação Atual

No estado atual, os comandos abaixo estão válidos:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

## Documentação e Operação

O `README.md` documenta:

- visão do produto
- stack
- módulos
- schema
- políticas
- sync remoto do Supabase
- preparação de empresa piloto
- diferenças entre cluster, pauta e núcleo
- regras de permissão entre member, moderator e admin

## Pontos de Atenção

- O radar ainda agrega em memória; se a base crescer muito, a próxima evolução natural é mover essas contagens para SQL.
- A operação depende de migrations bem ordenadas e sincronizadas com o remoto.
- A modelagem está estável, mas ainda há bastante superfície de consulta entre módulos; mudanças em schema devem continuar passando pelo checklist de sync.

## Conclusão

O projeto já está em uma forma operacional consistente. A base técnica, a separação entre papéis e a navegação principal estão prontas. O que mais falta agora é uso real, volume de dados e eventual refinamento do radar e da governança a partir da operação da empresa piloto.
