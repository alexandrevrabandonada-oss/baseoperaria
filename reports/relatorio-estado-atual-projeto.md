# Relatorio de Estado Atual do Projeto

Data de referencia: 16/04/2026

## Resumo executivo

O projeto Base Operaria esta em estado operacional consolidado e pronto para entrada em piloto controlado.

- Frontend e backend integrados com Supabase remoto, build, typecheck, lint e testes passando com estabilidade
- Suíte de testes automatizados expandida de 1 arquivo/5 testes (15/04) para 8 arquivos/29 testes (16/04)
- Cobertura de smoke inclui o fluxo critico completo: parsers de validacao, criacao de pauta a partir de cluster, attach/detach de relatos e economicos, save de cluster com auditoria e todos os caminhos de fallback/permissao
- Roteiro de smoke manual e guias operacionais disponíveis em reports/ para o time piloto

## Status por area

### Aplicacao web

Status: OK

- Stack ativa: Next.js 16.2.3, React 19, TypeScript estrito, Tailwind 4
- Rotas disponiveis: /, /entrar, /auth/confirm, /onboarding, /relatos, /relatos/novo, /relatos/[id], /relatos/meus, /economico, /economico/novo, /economico/[id], /economico/meus, /pautas, /pautas/nova, /pautas/[id], /nucleos, /nucleos/novo, /nucleos/[id], /moderacao, /radar, /admin, /admin/clusters, /admin/clusters/[id], /admin/[section], /sair
- Sessao SSR via cookie implementada com proxy; auth por magic link com callback em /auth/confirm
- Middleware aplicado em todas as rotas protegidas

### Banco Supabase

Status: OK

Bootstrap aplicado em ordem:

1. supabase/sql/base_operaria_bootstrap.sql
2. supabase/sql/base_operaria_authz.sql
3. supabase/sql/base_operaria_storage.sql
4. supabase/sql/base_operaria_first_access_template.sql
5. supabase/sql/base_operaria_pilot_setup_template.sql

Estrutura de dados ativa:

- profiles, companies, company_memberships
- units, sectors, shifts, report_categories
- reports, report_attachments, report_confirmations
- economic_reports, economic_report_attachments, economic_report_confirmations
- issue_clusters, cluster_reports, cluster_economic_reports
- demands, demand_supporters
- nuclei, nucleus_members, actions, moderation_events
- Tabelas de lookup: severity_levels, frequency_levels, contract_types, salary_bands, issue_types, confirmation_types
- Buckets privados de storage com policies RLS

### Ambiente local

Status: OK

- .env.local com NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- service_role nao e usada no runtime

## Cobertura de testes automatizados

Executado em 16/04/2026:

- npm run typecheck: OK
- npm run lint: OK
- npm run test: OK — 8 arquivos, 29 testes
- npm run build: OK — 26 rotas dinamicas, build limpo

Mapa de smoke por arquivo:

| Arquivo | Cobertura |
|---|---|
| tests/workflows.test.ts | Parsers de onboarding, relato, economico, confirmacao e pauta (5 testes) |
| tests/pilot-smoke.test.ts | Cadeia completa de validacao do fluxo critico e guarda de return_to (2 testes) |
| tests/pauta-action-smoke.test.ts | Criacao de pauta de cluster, guarda de company mismatch (2 testes) |
| tests/cluster-save-smoke.test.ts | Save de cluster: create, update, duplicidade, erro generico, sem-permissao (8 testes) |
| tests/cluster-attach-report-smoke.test.ts | Attach de relato a cluster, bloqueio por empresa errada (2 testes) |
| tests/cluster-attach-smoke.test.ts | Attach de economico a cluster, bloqueio por empresa errada (2 testes) |
| tests/cluster-detach-smoke.test.ts | Detach de relato e economico, bloqueio por empresa errada (4 testes) |
| tests/cluster-action-error-smoke.test.ts | Fallback status=erro por falha de banco em attach e detach (4 testes) |

Lacunas intencionais (exigem validacao manual):

- Magic link real e ciclo de sessao no navegador
- Upload real para storage e leitura de anexo
- Persistencia real com RLS por papel no banco
- Reflexo de dados agregados no radar apos associacoes

## Riscos e pontos de atencao

### 1) Configuracao do Auth no painel Supabase

Risco: medio

Para magic link funcionar localmente:

- Site URL: http://localhost:3000
- Redirect URL: http://localhost:3000/auth/confirm?next=/onboarding

### 2) IDs de first access no setup inicial

Risco: baixo

Os scripts de first_access e pilot_setup usam UUIDs fixos. Em novo ambiente, esses UUIDs precisam corresponder a usuarios reais em auth.users antes de executar.

### 3) Escalabilidade do radar

Risco: baixo/medio

A agregacao atual e feita em memoria. Com crescimento de volume, pode ser util migrar agregacoes pesadas para views ou funcoes SQL dedicadas no Supabase.

## Artefatos operacionais disponíveis

| Arquivo | Finalidade |
|---|---|
| reports/guia-operacao-piloto.md | Roteiro operacional de abertura do piloto |
| reports/checklist-uso-inicial-piloto.md | Checklist curto de uso inicial para a equipe |
| reports/roteiro-smoke-piloto.md | Smoke funcional guiado com mapa de cobertura automatica vs manual |
| reports/supabase-bootstrap-checklist.md | Ordem tecnica de bootstrap e validacoes rapidas |
| reports/relatorio-validacao-funcional-ponta-a-ponta.md | Validacao funcional descritiva do sistema |
| README.md | Guia completo de setup local, schema e fluxos do produto |
