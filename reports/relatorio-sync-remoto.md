# Relatório Curto de Sync Remoto

Data: 15/04/2026

## O que foi conferido

- Estrutura do repositório e arquivos de configuração principais
- Ordem canônica das migrations em `supabase/migrations`
- Separação entre migrations de schema, RLS, seeds e storage
- Presença dos módulos `Relatos` e `Pauta Econômica`
- Base de Supabase SSR e uso de `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ausência de `service_role` no runtime do app

## O que foi adicionado

- `npm run supabase:sync-checklist`
- `npm run supabase:diagnose`
- Checklist executável de aplicação das migrations remotas
- Diagnóstico remoto para tabelas, RLS, buckets e policies
- Documentação do processo no `README.md`

## Validação executada

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `node scripts/supabase-sync-checklist.mjs`

## Observação

O diagnóstico remoto exige `SUPABASE_DB_URL` ou `DATABASE_URL`. Sem isso, o script falha de forma explícita e não tenta usar credenciais administrativas no runtime do app.

