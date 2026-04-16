# Supabase Bootstrap Checklist

Ordem recomendada no SQL Editor do Supabase:

1. Rode [supabase/sql/base_operaria_bootstrap.sql](../supabase/sql/base_operaria_bootstrap.sql)
2. Rode [supabase/sql/base_operaria_authz.sql](../supabase/sql/base_operaria_authz.sql)
3. Rode [supabase/sql/base_operaria_storage.sql](../supabase/sql/base_operaria_storage.sql)
4. Rode [supabase/sql/base_operaria_first_access_template.sql](../supabase/sql/base_operaria_first_access_template.sql)
5. Rode [supabase/sql/base_operaria_pilot_setup_template.sql](../supabase/sql/base_operaria_pilot_setup_template.sql)

Verificações rápidas depois da execução:

1. Em Authentication > Users, confirme que o usuário inicial existe em `auth.users`
2. Em Table Editor > `profiles`, confirme que o profile foi criado para o UID inicial
3. Em Table Editor > `companies`, confirme que a empresa piloto foi criada
4. Em Table Editor > `company_memberships`, confirme que o usuário virou `owner`
5. Em Storage, confirme os buckets `report-attachments` e `economic-report-attachments`
6. Em `units`, `sectors`, `shifts` e `report_categories`, confirme a estrutura mínima do piloto

Se algo falhar:

1. Rode primeiro o script anterior da sequência e só depois retome o próximo
2. Se o erro mencionar policy ou função inexistente, o `base_operaria_authz.sql` ainda não foi aplicado
3. Se o erro mencionar bucket ou `storage.objects`, o `base_operaria_storage.sql` ainda não foi aplicado
4. Se o erro mencionar usuário inexistente, revise o UID em [supabase/sql/base_operaria_first_access_template.sql](../supabase/sql/base_operaria_first_access_template.sql)

## Validacao do app

Variaveis minimas em `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Configuracao de autenticacao no painel do Supabase:

1. Em Authentication > URL Configuration, ajuste o `Site URL` para o dominio que voce vai usar no app local ou publicado
2. Adicione o callback do magic link em Redirect URLs: `http://localhost:3000/auth/confirm?next=/onboarding`
3. Se houver ambiente publicado, adicione tambem a variante real do dominio: `https://<seu-dominio>/auth/confirm?next=/onboarding`

Teste funcional minimo:

1. Rode `npm install` se ainda nao instalou as dependencias
2. Rode `npm run dev`
3. Abra `/entrar` e envie um magic link para um e-mail valido
4. Clique no link recebido e confirme que o callback passa por `/auth/confirm`
5. Verifique se o usuario cai em `/onboarding` na primeira entrada
6. Conclua o onboarding e confirme que o registro em `profiles` foi atualizado
7. Abra `/relatos/novo` e `/economico/novo` para validar se empresa, unidade, setor, turno e categorias aparecem
8. Se for testar anexos, confirme no Storage se os arquivos entram nos buckets `report-attachments` e `economic-report-attachments`

Diagnostico rapido de falhas no app:

1. Se o login falhar sem enviar e-mail, revise `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Se o e-mail chegar mas o callback retornar para `/entrar?status=link-invalido`, revise as Redirect URLs do Supabase
3. Se o usuario entrar mas nao enxergar dados estruturais, confirme membership em `company_memberships`
4. Se anexos falharem, confira se o bucket existe e se o `base_operaria_storage.sql` foi aplicado sem cortes