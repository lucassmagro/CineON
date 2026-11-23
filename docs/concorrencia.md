# CineON — Transações e concorrência

> "Duas pessoas não podem comprar o mesmo assento da mesma sessão, nem que cliquem no mesmo instante."

## Três barreiras independentes

| # | Barreira | Onde |
|---|---|---|
| 1 | **Regra de negócio**: só reserva assento disponível (`estaDisponivel`) | `backend/src/services/ReservaService.ts` |
| 2 | **Transação + lock pessimista** (`SELECT … FOR UPDATE`, em ordem fixa) | `backend/src/repositories/MapaAssentosPrismaRepository.ts` |
| 3 | **Constraints**: PK `assentos_sessao(sessao_id, assento_id)` e o índice único parcial `ux_ingressos_assento_ativo` (só um ingresso não cancelado por assento) | migrações Prisma |

## Fluxo da reserva (uma transação interativa do Prisma, READ COMMITTED)

```
BEGIN
  1. lê a sessão; recusa se já começou (RN08)
  2. cancela a reserva pendente anterior do mesmo cliente nesta sessão (RN14)
  3. SELECT assento_id FROM assentos_sessao
       WHERE sessao_id = $1 AND assento_id = ANY($2)
       ORDER BY assento_id            ← ordem fixa: evita deadlock (Aula 9)
       FOR UPDATE                     ← quem chegar depois ESPERA aqui
  4. SELECT (novo comando) estado + reserva de cada assento
  5. service: algum indisponível? → AssentoIndisponivelError → ROLLBACK → HTTP 409
  6. INSERT reservas (PENDENTE, expira_em = agora + 10 min)
  7. UPDATE assentos_sessao SET status = 'RESERVADO', reserva_id = nova
COMMIT
```

**Dois cliques no mesmo instante:** a transação A trava as linhas no passo 3. A transação B fica **bloqueada** no mesmo `FOR UPDATE` até A fazer COMMIT. Quando B continua, lê (passo 4) o assento já RESERVADO por A, e o service responde **409**.

### Por que travar e ler em dois comandos (bug encontrado pelos testes)

A primeira versão fazia o lock e a leitura **no mesmo comando**: `SELECT … FROM assentos_sessao a LEFT JOIN reservas r … FOR UPDATE OF a`. O teste com 20 requisições simultâneas mostrou **20 reservas aceitas**.

O motivo está no READ COMMITTED do PostgreSQL. Quando B consegue o lock depois de esperar, o banco relê a **linha travada** na versão nova (`assentos_sessao`, agora RESERVADO). Mas as linhas das **outras tabelas do JOIN** (`reservas`) continuam vindo do snapshot do início do comando, e nele a reserva criada por A ainda não existia. O assento aparecia como "reservado por ninguém" e a regra o tratava como disponível.

A correção tem duas partes:
1. O lock (`FOR UPDATE`) e a leitura viram **dois comandos**. O segundo comando tira um snapshot novo e enxerga tudo o que A confirmou. Como B segura o lock, nada muda entre os dois comandos.
2. A regra ficou **à prova de falha**: assento RESERVADO sem dados da reserva visíveis conta como **indisponível**.

Depois da correção, o teste passou em execuções repetidas: 1 aceita e 19 recusadas.

### Por que não SERIALIZABLE?

Também funcionaria, mas o PostgreSQL aborta transações com erro de serialização (`40001`), e a aplicação precisaria de lógica de nova tentativa. O lock pessimista com ordem fixa é determinístico, dispensa retry e é o mecanismo visto em aula (2PL / `FOR UPDATE`).

## Pagamento

```
BEGIN
  SELECT … FROM reservas WHERE id = $1 FOR UPDATE      ← dois "Pagar" simultâneos são serializados
  service: PENDENTE? dentro do prazo? dono ou operador?
  SELECT … FROM assentos_sessao WHERE reserva_id = $1 ORDER BY assento_id FOR UPDATE
  INSERT pagamentos; UPDATE reservas (PAGA); UPDATE assentos_sessao (VENDIDO)
  INSERT ingressos  ← UNIQUE(codigo) e UNIQUE parcial (sessao_id, assento_id)
COMMIT
```

## Expiração

- **Sob demanda**: reserva PENDENTE com `expira_em <= agora` já conta como livre no mapa e na reserva. A expiração vale no instante exato, mesmo sem o job.
- **Job** (`backend/src/jobs/expirarReservas.ts`, a cada 30 s): `ReservaService.expirarVencidas()` usa `FOR UPDATE SKIP LOCKED` para não disputar com um pagamento em andamento. Ele marca as reservas como EXPIRADA e libera os assentos.

## Validação do ingresso

`SELECT id FROM ingressos WHERE codigo = $1 FOR UPDATE`: duas validações simultâneas do mesmo código são serializadas, e só a primeira marca UTILIZADO.

## Cancelamento do ingresso

Uma transação: `SELECT ... FROM ingressos WHERE codigo = ANY($1) ORDER BY id FOR UPDATE`, depois o `FOR UPDATE` dos assentos (`ORDER BY assento_id`), e só então assento LIVRE, ingresso CANCELADO e desconto no `valor_total` da reserva. A ordem dos locks é sempre ingressos e depois assentos, então dois cancelamentos cruzados não fazem deadlock, e um cancelamento junto com uma validação do mesmo código é serializado pelo lock do ingresso.

## Testes automatizados (`backend/tests/concorrencia.test.ts`)

| Teste | Resultado esperado |
|---|---|
| 20 pessoas reservam o mesmo assento ao mesmo tempo | 1 × 201, 19 × 409 |
| 3 pedidos com assentos cruzados em ordens diferentes | 1 × 201, 2 × 409, nenhum 500 (sem deadlock) |
| 5 pagamentos simultâneos da mesma reserva | 1 × 201, 4 × 409, só 2 ingressos |
| 4 validações simultâneas do mesmo ingresso | 1 × 200, 3 × 409 |
| 4 cancelamentos simultâneos do mesmo ingresso | 1 × 200, 3 × 409, valor estornado uma vez só |
| INSERT direto de ingresso duplicado (simulando um bug) | o banco recusa (P2002) |

Demonstração ao vivo em produção: `npm run demo:concorrencia -- https://api.cineon.agp.app.br 20`

## Índices em uso (EXPLAIN ANALYZE no banco de desenvolvimento)

**Validação por código**: usa o índice único.
```
Index Scan using ingressos_codigo_key on ingressos (actual time=0.015..0.016 rows=1)
  Index Cond: ((codigo)::text = 'WYUD8FEG78'::text)
Execution Time: 0.076 ms
```

**Job de expiração**: usa o **índice parcial** (só reservas PENDENTES).
```
Limit -> LockRows
  -> Index Scan using ix_reservas_pendentes_expira_em on reservas
       Index Cond: (expira_em <= now())
Execution Time: 0.040 ms
```

**Mapa de uma sessão**: usa a PK composta (prefixo `sessao_id`).
```
Bitmap Heap Scan on assentos_sessao
  -> Bitmap Index Scan on assentos_sessao_pkey
       Index Cond: (sessao_id = 40)
Execution Time: 0.551 ms
```

**Relatório (`fn_relatorio_ocupacao`)**: as CTEs agregam `assentos` e `ingressos` **antes** dos JOINs (Hash Join com 36 e 55 linhas, em vez de 236 e 1.499).
```
Hash Left Join  (s.id = v.sessao_id)
  -> Hash Left Join (s.sala_id = c.sala_id)
       -> Hash Join (s.sala_id = sa.id) -> Hash Join (s.filme_id = f.id)
       -> HashAggregate (Group Key: a.sala_id)   -- CTE capacidade_sala
  -> HashAggregate (Group Key: i.sessao_id)       -- CTE vendas_sessao
Execution Time: 1.984 ms
```
