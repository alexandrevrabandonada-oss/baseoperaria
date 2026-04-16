# Guia de Operacao do Piloto

Data: 15/04/2026

## Objetivo

Este guia organiza o uso inicial do Base Operaria em um piloto real controlado, sem abrir mais complexidade do que o necessario.

O piloto parte de uma empresa unica, com estrutura minima, papeis claros e um fluxo simples:

relato ou registro economico -> moderacao -> cluster -> pauta -> nucleo

## Estrutura inicial do piloto

Base prevista pelos scripts SQL:

### Empresa

- Empresa: `Empresa Piloto`
- Slug: `empresa-piloto`

### Unidade

- Unidade Principal

### Setores

- Producao
- Expedicao

### Turnos

- Dia: 08:00-17:00
- Noite: 22:00-06:00

### Categorias de condicoes

- Ritmo e carga
- Seguranca e risco
- Chefia e assedio

### Categorias economicas

- Salario e desconto
- Desvio de funcao
- Beneficio e vinculo

## Papeis iniciais do piloto

### Member

Entra para usar a base no dia a dia.

Pode:

- entrar por magic link
- concluir onboarding
- criar relatos
- criar registros economicos
- confirmar relatos e registros de outros usuarios da mesma empresa
- apoiar pautas existentes
- entrar em nucleos quando o acesso estiver liberado

Nao deve:

- cadastrar estrutura
- criar cluster
- abrir pauta direto
- operar moderacao

### Moderator

Entra depois que ja existe captura real na base.

Pode:

- revisar relatos e registros economicos
- arquivar, sinalizar e registrar eventos de moderacao
- vincular relatos e registros a clusters existentes
- acompanhar trilha de auditoria

Nao deve:

- manter cadastro estrutural da empresa
- virar gargalo de abertura do piloto

### Admin

Entra primeiro para preparar o terreno e sustentar a operacao.

Pode:

- manter empresa, unidades, setores, turnos e categorias
- criar e editar clusters
- criar pautas a partir de clusters
- criar e manter nucleos
- executar tudo que o moderador executa

## Ordem recomendada de entrada no piloto

1. Admin inicial
2. Segundo admin ou apoio organizador, se houver
3. Moderator, quando a base ja tiver relatos suficientes para triagem
4. Members do primeiro setor ou turno escolhido para o piloto

## Preparacao pratica antes de liberar uso

1. Confirmar que a empresa piloto existe e esta ativa
2. Confirmar que a unidade principal existe
3. Confirmar que Producao e Expedicao estao cadastrados
4. Confirmar que Dia e Noite estao cadastrados
5. Confirmar que as categorias de condicoes e economicas estao ativas
6. Confirmar que o admin inicial aparece em `company_memberships` com papel `owner` ou `admin`
7. Definir quem vai moderar a primeira semana do piloto

## Operacao da primeira semana

### Fase 1: abrir captura

Meta: fazer a base receber os primeiros registros reais.

Passos:

1. Liberar entrada dos primeiros members
2. Pedir pelo menos um relato de condicoes e um registro economico por frente inicial
3. Validar se os anexos entram nos buckets corretos
4. Evitar abrir nucleo ou pauta cedo demais

### Fase 2: abrir moderacao

Meta: separar ruido de sinal util.

Passos:

1. Moderator revisa os primeiros relatos e registros
2. Marca o que e repeticao, urgencia ou prova forte
3. Junta itens parecidos em clusters existentes ou pede ao admin criacao de novo cluster

### Fase 3: transformar sinal em pauta

Meta: sair do registro isolado e chegar a uma pauta objetiva.

Passos:

1. Admin revisa clusters com recorrencia ou peso politico real
2. Quando houver base suficiente, cria pauta a partir do cluster
3. Members passam a apoiar a pauta no app

### Fase 4: abrir nucleo

Meta: organizar gente em torno de uma pauta ja madura.

Abra nucleo apenas quando:

- existir pauta clara
- houver pessoas dispostas a acompanhar o problema
- fizer sentido separar trabalho por setor ou tema

Nao abra nucleo quando ainda so existir ruido, caso isolado ou captura sem triagem.

## Regras operacionais simples

### Quando um relato vira cluster

Um relato ou registro economico deve virar cluster quando houver pelo menos um destes sinais:

- repeticao do mesmo problema em mais de um registro
- impacto forte no mesmo setor, turno ou unidade
- combinacao de urgencia com prova concreta
- clareza suficiente para virar frente de organizacao

### Quando um cluster vira pauta

Um cluster deve virar pauta quando:

- o problema ja esta nomeado com clareza
- existe recorrencia ou peso suficiente para acao coletiva
- faz sentido pedir apoio e acompanhamento de outras pessoas

### Quando abrir nucleo

Abra nucleo quando:

- a pauta precisa de acompanhamento continuo
- ja existe um grupo minimo disposto a tocar a frente
- o problema tem recorte por setor ou tema que exige organizacao dedicada

## Permissoes minimas recomendadas no piloto

Para o piloto inicial, a regra recomendada e manter o minimo atual:

- `member`: captura, confirmacao, apoio e participacao basica
- `moderator`: revisao, associacao a cluster, trilha de auditoria
- `admin`: estrutura, cluster, pauta e nucleo

Nao ha necessidade de ampliar permissao agora.

Em especial:

- moderador nao precisa criar pauta no primeiro ciclo
- member nao precisa criar cluster
- `observer` pode ficar fora do piloto inicial

## O que checar no admin

Em `/admin`, a ordem pratica e:

1. Empresas
2. Unidades
3. Setores
4. Turnos
5. Categorias
6. Clusters

## O que checar na moderacao

Em `/moderacao`, verificar:

1. fila de relatos
2. fila economica
3. anexos acessiveis
4. trilha de auditoria sendo gravada

## Fechamento do piloto inicial

O piloto pode ser considerado iniciado quando:

- a empresa piloto estiver estruturada
- admin e moderator estiverem definidos
- os primeiros members tiverem entrado
- existir pelo menos um relato e um registro economico validos
- a moderacao tiver conseguido transformar sinais em pelo menos um cluster
