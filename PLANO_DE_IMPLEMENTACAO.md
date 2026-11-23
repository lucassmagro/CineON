# CineON — Plano de Implementação

> Trabalho Final — Programação II + Banco de Dados II (UNOESC Chapecó, 2026/2)
> Apresentação: **24/11/2026**, presencial, **com o sistema rodando em produção**.
> Documento para validação **antes** de qualquer código ser escrito.

---

## 0. Resumo executivo

O **CineON** é um app de bilheteria de cinema com marcação de assentos. São dois programas:

| Programa | Tecnologia | Papel |
|---|---|---|
| `backend/` (cineon-api) | TypeScript, Node.js ≥ 22, Express 5, Prisma 7, PostgreSQL | API REST/JSON em camadas **controller → service → repository** |
| `mobile/` (cineon-app) | Expo SDK 57 / React Native, TypeScript, Expo Router | App Android/iOS/Web com telas por papel (Cliente, Bilheteria, Gerência) |

O núcleo técnico (o que mais pesa na nota) é: **um assento de uma sessão nunca é vendido duas vezes, nem com cliques simultâneos**. Para garantir isso usamos **três barreiras independentes**:

1. **Service**: regra de negócio explícita (assento precisa estar livre ou com reserva vencida).
2. **Transação + lock pessimista** (`SELECT … FOR UPDATE`, em ordem fixa para evitar deadlock), dentro de `prisma.$transaction`.
3. **Constraints do banco**: PK composta `(sessao_id, assento_id)` no mapa da sessão e `UNIQUE (sessao_id, assento_id)` nos ingressos. É a última barreira.

As versões e convenções seguem os projetos que o professor passou (`receitas-api`, `catalogo-filmes-api`, `receitas`), para o código ficar parecido com o que foi ensinado.

### Decisões aprovadas (09/11/2026)

| # | Decisão | Aprovado |
|---|---|---|
| D1 | Repositório | **Monorepo** `CineON/` com `backend/` e `mobile/` |
| D2 | Domínio | **Cinema** (entidade `Filme`) |
| D3 | Produção | **AWS EC2 + RDS PostgreSQL + nginx + systemd + HTTPS (certbot)**, como na Aula 12 de P2 |
| D4 | Extras | **Só o que o PDF pede.** Ficam **fora** a meia-entrada, o QR Code, a leitura pela câmera e a escolha de método de pagamento. O ingresso tem **código único** (texto) e o pagamento é um único botão "Pagar" simulado |
| D5 | Expiração da reserva | O PDF não define. **10 min**, configurável por `RESERVA_MINUTOS` no `.env` (na demonstração dá para usar 2 min) |
| D6 | Equipe | Alexandre Reitemeyer, Lucas Santos Magro, Beatriz Miranda, Gabriel Nassinger |
| — | Visual do app | **Extremamente simples e objetivo**, inspirado no visual iOS da Apple (fonte do sistema, listas agrupadas, azul `#007AFF`). Será lapidado depois |

> As seções abaixo já refletem o D4: onde ainda aparecerem "meia-entrada", "QR" ou "método de pagamento", vale esta tabela.

---

## 1. Requisitos do PDF → como o CineON atende

### 1.1 Requisitos funcionais

| Requisito do PDF | Como será atendido |
|---|---|
| Cadastro de filmes, salas, assentos e sessões (sala, data/hora, preço) | Telas de Gerência. A sala é cadastrada com **nº de filas × assentos por fila**, e os assentos são gerados por uma **stored procedure**. Na sessão, o operador escolhe filme e sala em listas (nunca digita IDs) |
| Mapa de assentos por sessão (livre, reservado, vendido) | Tabela `assentos_sessao`, gerada por **trigger** quando a sessão é criada. Endpoint `GET /sessoes/:id/assentos`. Componente `MapaAssentos` com legenda de cores |
| Reserva temporária com expiração | `reservas.expira_em`. Expiração tratada **no service**, de duas formas: sob demanda (reserva vencida conta como livre) e por um job periódico que libera os assentos |
| Pagamento da reserva e emissão de ingresso com código único | `POST /reservas/:id/pagamento`. Pagamento **simulado** (sempre aprovado, registrado em `pagamentos`). Um ingresso por assento, com `codigo` único (constraint) |
| Validação do ingresso na entrada | `POST /ingressos/validacao`: marca como `UTILIZADO`, grava data/hora e o operador. Uma segunda validação dá erro "já utilizado às hh:mm" |
| Cadastro de usuários e acesso autenticado | `POST /auth/cadastro` (cliente), JWT Bearer, senha com bcrypt, token no SecureStore |
| Relatório de vendas e de ocupação por sessão | Função SQL com CTE juntando **5 tabelas**. Tela de Relatórios com filtros de período e filme |
| Telas por papel | Cliente (navega, escolhe assentos, paga, vê ingressos). Operador (Bilheteria: venda no balcão e validação. Gerência: cadastros e relatórios) |

### 1.2 Matriz de avaliação (rubrica → onde está no projeto)

| Disciplina / critério | Peso | Onde atendemos |
|---|---|---|
| **P2 – Camada de acesso a dados (repository)** | 2 | `backend/src/repositories/*`: o **único** lugar que importa o Prisma Client. Os repositórios recebem o `tx` da transação quando precisam |
| **P2 – Regras de negócio (service)** | 4 | `backend/src/services/*`: todas as regras RN01–RN15 (seção 7), erros de domínio tipados, nenhum `any`. Os services recebem os repositórios por construtor (Inversão de Dependência, Aula 6), o que permite testes unitários com repositório em memória |
| **P2 – Interface gráfica** | 3 | Formulários pedem só o necessário (sem IDs nem totais), estados de carregando/erro/vazio, confirmação antes de ações destrutivas, nenhum dado sensível exposto (seção 10.4) |
| **P2 – Arquitetura** | 1 | Dois programas, API JSON, camadas controller/service/repository explícitas em pastas com esses nomes |
| **BD2 – Modelagem** | 2 | DER com 10 tabelas, PKs, FKs, `UNIQUE`, `CHECK`, `EXCLUDE` (proíbe sessões sobrepostas na mesma sala), PK composta do assento por sessão |
| **BD2 – Migração** | 1 | Prisma Migrate. Migrações geradas do schema e migrações SQL manuais (`--create-only`) para trigger, procedure, função, CHECK, EXCLUDE e índice parcial |
| **BD2 – SQL** | 3 | 2 triggers, 1 procedure (`CALL`), 2 funções, índices B-Tree (compostos e parcial), PK/FK em tudo |
| **BD2 – Transações e concorrência** | 2 | Reserva e pagamento em transação interativa, `FOR UPDATE` em ordem fixa, constraints como última barreira, teste automatizado com N requisições simultâneas no mesmo assento |
| **BD2 – Relatório** | 1 | `fn_relatorio_ocupacao` junta sessões, filmes, salas, assentos e ingressos (5 tabelas), com CTE |
| **BD2 – ORM** | 1 | `schema.prisma` com relações 1:N, N:N explícita e 1:1, enums, `@@unique`, `@@index`, `include`/`select` tipados, `groupBy`, `$transaction` |
| **Entrega – produção** | — | AWS (EC2 + RDS) com HTTPS. O app aponta para a URL pública |

---

## 2. Stack e convenções (iguais às do professor)

**Backend** (mesmas dependências do `receitas-api`):
- `express@5`, `@prisma/client@7` + `@prisma/adapter-pg` + `pg`, `prisma@7` (dev), `zod@4`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`
- `typescript` (strict + `noUncheckedIndexedAccess`), `tsx` (dev/watch), testes com `node:test` via `tsx --test`
- `"type": "module"`, imports com `.js`, `prisma.config.ts`, client gerado em `generated/prisma`
- Scripts: `dev`, `build`, `start`, `migrate`, `seed`, `studio`, `typecheck`, `test`, `postinstall: prisma generate`
- `docker-compose.yml` com `postgres:16` para desenvolvimento
- `requisicoes.http` (REST Client do VS Code) com todos os endpoints, como nos exemplos das aulas

**Frontend** (mesma base do app `receitas`):
- Expo SDK 57, `expo-router` (rotas em `src/app`), `expo-secure-store` (token), React 19, TS strict, alias `@/*`
- Arquitetura **MVVM** da Aula 9: `models/` + `services/` (Model), `hooks/` (ViewModel), `components/` + `app/` (View)
- `TemaContext` (claro/escuro), `AuthContext`, componentes `Estados` (Carregando / MensagemErro / Vazio)
- `EXPO_PUBLIC_API_URL` no `.env` (só a URL, nunca segredos)
- Extras: `react-native-qrcode-svg` + `react-native-svg` (QR no ingresso). `expo-camera` só se D4 incluir a leitura pela câmera

**Nomenclatura**: domínio em português (`Sessao`, `Reserva`, `Ingresso`), como o professor faz. Pastas de camada com os nomes da rubrica (`controllers/`, `services/`, `repositories/`) para o avaliador encontrar na hora. No banco, tabelas e colunas em `snake_case` via `@@map`/`@map`, para o SQL manual (triggers e procedures) ficar limpo, sem aspas.

---

## 3. Estrutura do repositório

```
CineON/
├── README.md                      # visão geral, links de produção, como rodar
├── PLANO_DE_IMPLEMENTACAO.md      # este arquivo
├── .gitignore                     # inclui artefatos/ e o PDF (material do professor fora do Git)
├── docs/
│   ├── der.md / der.png           # Diagrama Entidade-Relacionamento (Mermaid + imagem)
│   ├── casos-de-uso.puml / .png   # Diagrama de Casos de Uso (PlantUML)
│   ├── api.md + openapi.yaml      # Definição da API
│   ├── regras-de-negocio.md
│   ├── concorrencia.md            # como e por que um assento nunca é vendido 2x (+ EXPLAIN)
│   ├── deploy.md                  # passo a passo AWS
│   └── telas/                     # prints das telas (e wireframes, opcionais)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/            # geradas + SQL manual (triggers, procedure, função...)
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts  app.ts  config.ts  prisma.ts
│   │   ├── routes/                # Router do Express: URL → middlewares → controller
│   │   ├── controllers/           # HTTP: valida entrada (Zod), chama service, monta DTO e status
│   │   ├── services/              # REGRAS DE NEGÓCIO (únicas). Não conhecem Express nem Prisma
│   │   ├── repositories/          # Persistência via Prisma Client (único lugar com Prisma)
│   │   ├── domain/
│   │   │   ├── erros.ts           # ErroDominio e subclasses
│   │   │   ├── pagamento/         # Strategy + Factory (Pix, Cartão, Dinheiro)
│   │   │   └── precificacao/      # Strategy de tipo de ingresso (Inteira, Meia)
│   │   ├── dto/                   # tipos de resposta + mapeadores (nunca expõem senhaHash)
│   │   ├── validation/            # schemas Zod
│   │   ├── middlewares/           # autenticar, exigirPapel, tratarErros, log
│   │   └── jobs/expirarReservas.ts
│   ├── tests/                     # integração (API + banco) e unitários (services)
│   ├── docker-compose.yml  .env.example  requisicoes.http
│   └── package.json  tsconfig.json  tsconfig.build.json  prisma.config.ts
└── mobile/
    ├── src/{app,components,contexts,hooks,models,services,storage}
    ├── app.json  .env.example  package.json  tsconfig.json
```

> Observação: `artefatos/` tem `.env` de exemplo e zips do professor. Vou colocar essa pasta e o PDF no `.gitignore` para não publicar material de aula no GitHub.

---

## 4. Modelagem de dados

### 4.1 DER (Mermaid. Vai para `docs/der.md` e é exportado como PNG)

```mermaid
erDiagram
    USUARIOS ||--o{ RESERVAS : "faz"
    USUARIOS ||--o{ INGRESSOS : "valida (operador)"
    FILMES   ||--o{ SESSOES : "tem"
    SALAS    ||--o{ ASSENTOS : "possui"
    SALAS    ||--o{ SESSOES : "recebe"
    SESSOES  ||--o{ ASSENTOS_SESSAO : "mapa"
    ASSENTOS ||--o{ ASSENTOS_SESSAO : "aparece em"
    SESSOES  ||--o{ RESERVAS : "tem"
    RESERVAS |o--o{ ASSENTOS_SESSAO : "segura"
    RESERVAS ||--o| PAGAMENTOS : "é paga por"
    RESERVAS ||--o{ INGRESSOS : "gera"
    ASSENTOS_SESSAO ||--o| INGRESSOS : "vendido como"

    USUARIOS { int id PK
               varchar nome
               varchar email UK
               varchar senha_hash
               enum papel "CLIENTE | OPERADOR"
               timestamptz criado_em }
    FILMES   { int id PK
               varchar titulo
               text sinopse
               int duracao_min "CHECK > 0"
               varchar classificacao
               varchar genero
               varchar poster_url
               bool ativo }
    SALAS    { int id PK
               varchar nome UK
               bool ativa }
    ASSENTOS { int id PK
               int sala_id FK
               varchar fila "A, B, C..."
               int numero "CHECK > 0"
               UK "(sala_id, fila, numero)" }
    SESSOES  { int id PK
               int filme_id FK
               int sala_id FK
               timestamptz inicio
               timestamptz fim "inicio + duracao + limpeza"
               decimal preco "CHECK >= 0"
               enum status "ATIVA | CANCELADA"
               EXCLUDE "sala_id =, tstzrange(inicio,fim) &&" }
    ASSENTOS_SESSAO { int sessao_id PK,FK
                      int assento_id PK,FK
                      enum status "LIVRE | RESERVADO | VENDIDO"
                      int reserva_id FK "null se LIVRE"
                      timestamptz atualizado_em }
    RESERVAS { int id PK
               int usuario_id FK
               int sessao_id FK
               enum status "PENDENTE | PAGA | EXPIRADA | CANCELADA"
               enum canal "ONLINE | BALCAO"
               varchar nome_cliente "balcão, opcional"
               timestamptz criada_em
               timestamptz expira_em "CHECK > criada_em"
               decimal valor_total }
    PAGAMENTOS { int id PK
                 int reserva_id FK,UK
                 enum metodo "PIX | CARTAO | DINHEIRO"
                 decimal valor
                 varchar transacao "id simulado"
                 timestamptz pago_em }
    INGRESSOS { int id PK
                varchar codigo UK
                int reserva_id FK
                int sessao_id FK
                int assento_id FK
                enum tipo "INTEIRA | MEIA"
                decimal valor
                enum status "VALIDO | UTILIZADO | CANCELADO"
                timestamptz emitido_em
                timestamptz utilizado_em
                int validado_por_id FK
                UK "(sessao_id, assento_id)" }
    LOG_AUDITORIA { bigint id PK
                    varchar tabela
                    varchar operacao
                    jsonb dados_antigos
                    jsonb dados_novos
                    timestamptz ocorrido_em }
```

### 4.2 Por que `assentos_sessao` (o mapa materializado)

- Cada sessão tem **uma linha por assento da sala**, criada pela trigger. A PK composta `(sessao_id, assento_id)` garante **estruturalmente** que existe um único estado por assento em cada sessão.
- O mapa de assentos vira um `SELECT` simples e indexado (sem calcular o estado a partir do histórico de reservas).
- É a linha que travamos com `FOR UPDATE` durante a disputa. A trava fica no nível de tupla, a menor granularidade (Aula 9 de BD2), o que dá a maior concorrência possível.
- `CHECK ((status = 'LIVRE') = (reserva_id IS NULL))` mantém o estado coerente.
- `ingressos` tem uma FK composta `(sessao_id, assento_id)` para `assentos_sessao` e `UNIQUE (sessao_id, assento_id)`. Mesmo com um bug no código, **o banco recusa um segundo ingresso para o mesmo assento**.

### 4.3 Constraints e índices (justificados)

| Objeto | Tipo | Motivo |
|---|---|---|
| `usuarios(email)` | UNIQUE (B-Tree) | login e cadastro |
| `assentos(sala_id, fila, numero)` | UNIQUE composto | assento fixo da sala, sem duplicata |
| `sessoes` `EXCLUDE USING gist (sala_id WITH =, tstzrange(inicio, fim) WITH &&) WHERE status = 'ATIVA'` | Exclusion (extensão `btree_gist`) | o banco impede duas sessões ativas sobrepostas na mesma sala |
| `sessoes(filme_id, inicio)` | índice composto | "sessões do filme X a partir de hoje" (tela do cliente) |
| `sessoes(inicio)` | índice | listagem por data e relatório por período |
| `assentos_sessao(sessao_id, assento_id)` | PK | unicidade do assento por sessão |
| `assentos_sessao(reserva_id)` | índice | liberar os assentos de uma reserva |
| `reservas(expira_em) WHERE status = 'PENDENTE'` | **índice parcial** | o job de expiração só olha as pendentes (índice pequeno) |
| `reservas(usuario_id, criada_em DESC)` | índice | "minhas reservas/ingressos" |
| `ingressos(codigo)` | UNIQUE | validação na entrada (busca por igualdade) |
| `ingressos(sessao_id, assento_id)` | UNIQUE | **nunca vender o mesmo assento duas vezes** |
| `pagamentos(reserva_id)` | UNIQUE (1:1) | uma reserva tem no máximo um pagamento |
| CHECKs | `preco >= 0`, `duracao_min > 0`, `numero > 0`, `expira_em > criada_em`, `valor >= 0`, `fim > inicio` | integridade de domínio |

Em `docs/concorrencia.md` vamos registrar o `EXPLAIN ANALYZE` de 2 ou 3 consultas (mapa da sessão, validação por código, relatório), antes e depois dos índices, como no exercício da Aula 7.

### 4.4 Esboço do `schema.prisma` (trecho)

```prisma
enum Papel           { CLIENTE OPERADOR }
enum StatusAssento   { LIVRE RESERVADO VENDIDO }
enum StatusReserva   { PENDENTE PAGA EXPIRADA CANCELADA }
enum StatusIngresso  { VALIDO UTILIZADO CANCELADO }
enum TipoIngresso    { INTEIRA MEIA }
enum MetodoPagamento { PIX CARTAO DINHEIRO }

model Sessao {
  id      Int      @id @default(autoincrement())
  filmeId Int      @map("filme_id")
  salaId  Int      @map("sala_id")
  inicio  DateTime @db.Timestamptz(3)
  fim     DateTime @db.Timestamptz(3)
  preco   Decimal  @db.Decimal(10, 2)
  status  StatusSessao @default(ATIVA)
  filme   Filme    @relation(fields: [filmeId], references: [id], onDelete: Restrict)
  sala    Sala     @relation(fields: [salaId], references: [id], onDelete: Restrict)
  assentos AssentoSessao[]
  reservas Reserva[]
  ingressos Ingresso[]
  @@index([filmeId, inicio])
  @@index([inicio])
  @@map("sessoes")
}

model AssentoSessao {
  sessaoId  Int           @map("sessao_id")
  assentoId Int           @map("assento_id")
  status    StatusAssento @default(LIVRE)
  reservaId Int?          @map("reserva_id")
  sessao    Sessao   @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  assento   Assento  @relation(fields: [assentoId], references: [id], onDelete: Restrict)
  reserva   Reserva? @relation(fields: [reservaId], references: [id], onDelete: SetNull)
  ingresso  Ingresso?
  @@id([sessaoId, assentoId])
  @@index([reservaId])
  @@map("assentos_sessao")
}
```

Dinheiro em `Decimal(10,2)` (nunca `Float`). Datas em `timestamptz`. O app mostra no fuso `America/Sao_Paulo`.

---

## 5. Objetos SQL (migrações manuais com `prisma migrate dev --create-only`)

A divisão é deliberada. **Banco**: integridade, dados derivados, auditoria e consultas de relatório. **Service**: decisões de negócio (o PDF exige que o "não vender duas vezes" e a "expiração" sejam regras do service). Assim atendemos BD2 (trigger/procedure) **sem** tirar pontos de P2.

### 5.1 Trigger 1 — gerar o mapa da sessão (dado derivado)

```sql
CREATE OR REPLACE FUNCTION fn_trg_sessao_gera_mapa() RETURNS trigger AS $$
BEGIN
  INSERT INTO assentos_sessao (sessao_id, assento_id, status)
  SELECT NEW.id, a.id, 'LIVRE' FROM assentos a WHERE a.sala_id = NEW.sala_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessao_gera_mapa
AFTER INSERT ON sessoes FOR EACH ROW EXECUTE FUNCTION fn_trg_sessao_gera_mapa();
```

### 5.2 Trigger 2 — auditoria (o exercício da tabela `log` da Aula 6 de BD2)

`AFTER INSERT OR UPDATE OR DELETE` em `reservas` e `ingressos`. Grava `TG_TABLE_NAME`, `TG_OP`, `to_jsonb(OLD)` e `to_jsonb(NEW)` em `log_auditoria`. Fica registrado quem validou qual ingresso, quando cada reserva expirou etc.

### 5.3 Stored procedure — gerar os assentos de uma sala

```sql
CREATE OR REPLACE PROCEDURE sp_gerar_assentos_sala(p_sala_id int, p_filas int, p_por_fila int)
LANGUAGE plpgsql AS $$
DECLARE f int; n int;
BEGIN
  IF EXISTS (SELECT 1 FROM sessoes WHERE sala_id = p_sala_id) THEN
    RAISE EXCEPTION 'Sala % já possui sessões; layout não pode mudar', p_sala_id
      USING ERRCODE = 'P0001';
  END IF;
  DELETE FROM assentos WHERE sala_id = p_sala_id;
  FOR f IN 1..p_filas LOOP
    FOR n IN 1..p_por_fila LOOP
      INSERT INTO assentos (sala_id, fila, numero) VALUES (p_sala_id, chr(64 + f), n);
    END LOOP;
  END LOOP;
END; $$;
```

O service valida os limites (1–26 filas, 1–30 por fila) com mensagem amigável antes de chamar. O repositório executa `CALL sp_gerar_assentos_sala(...)` via `$executeRaw`, dentro da mesma transação que cria a sala.

### 5.4 Função de relatório (o relatório gerencial, 5 tabelas, com CTE)

```sql
CREATE OR REPLACE FUNCTION fn_relatorio_ocupacao(p_inicio timestamptz, p_fim timestamptz)
RETURNS TABLE (sessao_id int, filme text, sala text, inicio timestamptz,
               capacidade int, vendidos int, taxa_ocupacao numeric, receita numeric)
AS $$
  WITH cap AS (SELECT sala_id, count(*)::int AS capacidade FROM assentos GROUP BY sala_id),
       vend AS (SELECT sessao_id, count(*)::int AS vendidos, sum(valor) AS receita
                FROM ingressos WHERE status <> 'CANCELADO' GROUP BY sessao_id)
  SELECT s.id, f.titulo, sa.nome, s.inicio, c.capacidade,
         coalesce(v.vendidos, 0),
         round(coalesce(v.vendidos, 0) * 100.0 / nullif(c.capacidade, 0), 2),
         coalesce(v.receita, 0)
  FROM sessoes s
  JOIN filmes f  ON f.id = s.filme_id
  JOIN salas  sa ON sa.id = s.sala_id
  JOIN cap    c  ON c.sala_id = s.sala_id
  LEFT JOIN vend v ON v.sessao_id = s.id
  WHERE s.inicio >= p_inicio AND s.inicio < p_fim
  ORDER BY s.inicio;
$$ LANGUAGE sql STABLE;
```

Complemento pelo ORM (para mostrar consultas tipadas do Prisma): **vendas por método de pagamento e por canal** com `prisma.pagamento.groupBy` e `prisma.reserva.groupBy`.

### 5.5 Extras de BD2 (baratos, contam a favor)

- **Permissões (Aula 13)**: em produção a API conecta com o role `cineon_app`, que tem só `SELECT/INSERT/UPDATE/DELETE` nas tabelas, `EXECUTE` nas funções e `USAGE` nas sequences. As migrações rodam com o usuário dono (master do RDS). O script fica em `docs/deploy.md`.

---

## 6. Concorrência e transações (o ponto crítico)

### 6.1 Fluxo de reserva — `ReservaService.reservar(usuario, sessaoId, assentoIds)`

```
BEGIN  (prisma.$transaction interativa, READ COMMITTED, timeout 5s)
 1. service: valida entrada (1..10 assentos, sem repetidos), sessão ATIVA e ainda não iniciada
 2. repo:    SELECT a.sessao_id, a.assento_id, a.status, r.status, r.expira_em
             FROM assentos_sessao a LEFT JOIN reservas r ON r.id = a.reserva_id
             WHERE a.sessao_id = $1 AND a.assento_id = ANY($2)
             ORDER BY a.assento_id            ← ordem fixa: evita deadlock (Aula 9)
             FOR UPDATE OF a                  ← lock de linha: quem chegar depois ESPERA
 3. service: para cada assento: disponível se LIVRE, ou RESERVADO com reserva vencida
             (expira_em < now()). Se algum não estiver → throw AssentoIndisponivelError([...])
 4. service: cancela a reserva PENDENTE anterior do mesmo usuário nesta sessão (RN14)
 5. repo:    INSERT reservas (PENDENTE, expira_em = now() + 10 min)
 6. repo:    marca como EXPIRADA as reservas vencidas cujos assentos foram reaproveitados
 7. repo:    UPDATE assentos_sessao SET status='RESERVADO', reserva_id=:nova WHERE ...
COMMIT → 201 { id, expiraEm, assentos, valorEstimado }
```

**Dois cliques no mesmo instante:** a transação A trava as linhas no passo 2. A transação B fica **bloqueada** no mesmo `SELECT … FOR UPDATE` até A fazer commit. Quando B continua, o PostgreSQL (READ COMMITTED) relê a linha já atualizada (`RESERVADO`, não vencida), o service de B lança `AssentoIndisponivelError` e a API responde **409**. Mesmo se essa lógica falhasse, o pagamento esbarraria no `UNIQUE (sessao_id, assento_id)` de `ingressos`.

> Por que não `SERIALIZABLE`? Também funcionaria, mas aborta transações com erro de serialização e exige lógica de retry. O `FOR UPDATE` com ordem fixa é determinístico, é o que foi visto em aula e é fácil de explicar na apresentação. O texto de `docs/concorrencia.md` compara as duas opções.

### 6.2 Fluxo de pagamento — `PagamentoService.pagar(usuario, reservaId)`

> Pelo D4, os passos 4 e 5 ficam simplificados: valor = preço da sessão × nº de assentos, e o pagamento simulado é sempre aprovado (sem método nem Strategy/Factory).

```
BEGIN
 1. repo:    SELECT ... FROM reservas WHERE id = $1 FOR UPDATE
 2. service: reserva existe? é do usuário (ou o usuário é operador)? status PENDENTE?
             expira_em > now()? Se não → ReservaExpiradaError (410) / ReservaInvalidaError (409)
 3. repo:    SELECT ... FROM assentos_sessao WHERE reserva_id = $1 ORDER BY assento_id FOR UPDATE
 4. service: calcula valores por assento (Strategy: Inteira 100%, Meia 50%) → valor_total
 5. domain:  PagamentoFactory.criar(metodo).processar(valor)   ← simulado, sempre aprova
             (Pix: aprova na hora; Cartão: aprova e gera NSU fake; Dinheiro: só no balcão)
 6. repo:    INSERT pagamentos; UPDATE reservas SET status='PAGA', valor_total=...
 7. repo:    UPDATE assentos_sessao SET status='VENDIDO'
 8. service: gera códigos únicos (crypto.randomBytes → base32 de 10 caracteres, sem 0/O/1/I)
 9. repo:    INSERT ingressos (...)  ← UNIQUE(codigo) e UNIQUE(sessao,assento) protegem
             se colidir o código (P2002 em codigo) → service gera de novo (até 3 tentativas)
COMMIT → 201 { ingressos: [{ codigo, fila, numero, tipo, valor }] }
```

### 6.3 Expiração (regra no service, sem ficar só no banco)

- **Sob demanda**: no mapa (`GET /sessoes/:id/assentos`) e na reserva, o service trata `RESERVADO` com `expira_em < now()` como **LIVRE**. A expiração vale no instante exato, mesmo sem o job.
- **Job** (`jobs/expirarReservas.ts`, `setInterval` de 30 s): chama `ReservaService.expirarVencidas()`, que numa transação marca as reservas `PENDENTE` vencidas como `EXPIRADA` e devolve os assentos para `LIVRE` (usa o índice parcial). Usa `FOR UPDATE SKIP LOCKED` para não competir com um pagamento em andamento.
- O app mostra a contagem regressiva no checkout e, ao zerar, volta para o mapa.

### 6.4 Teste automatizado de concorrência

`tests/concorrencia.test.ts`: cria uma sessão, dispara **20 `POST /reservas` simultâneos** (`Promise.all`, 20 usuários diferentes) para o **mesmo assento** e verifica que há **exatamente 1 resposta 201 e 19 respostas 409**, e uma única linha `RESERVADO` no banco. Depois faz o mesmo para o pagamento. Também vira um script (`npm run demo:concorrencia -- --url https://api...`) para rodar **em produção durante a apresentação**.

---

## 7. Regras de negócio (todas em `services/`)

| RN | Regra |
|---|---|
| RN01 | Um assento só pode ter **um ingresso válido por sessão** |
| RN02 | Uma reserva expira em `RESERVA_MINUTOS` (padrão 10). Depois disso os assentos voltam a ficar livres |
| RN03 | Só se reserva assento `LIVRE` ou `RESERVADO` com reserva vencida |
| RN04 | Só se paga reserva `PENDENTE` e não vencida. O cliente só paga a própria reserva. O operador paga qualquer uma (venda no balcão) |
| RN05 | O pagamento emite 1 ingresso por assento, com código único de 10 caracteres e QR Code |
| RN06 | Validação: o ingresso existe, está `VALIDO` (sem restrição de horário). Marca `UTILIZADO` com data/hora e operador |
| RN07 | Sessão: não pode ser criada no passado. O preço é ≥ 0. O `fim` é calculado pelo service (`inicio + duração do filme + 15 min de limpeza`). Não pode sobrepor outra sessão ativa da mesma sala (o service checa para dar uma mensagem boa, e o `EXCLUDE` é a última barreira) |
| RN08 | Não se reserva nem vende sessão que já começou ou foi cancelada |
| RN09 | Máximo de 10 assentos por reserva |
| RN10 | O cliente vê só os próprios ingressos. Bilheteria e Gerência exigem o papel `OPERADOR` |
| RN11 | Meia-entrada = 50% do preço da sessão. O valor é sempre calculado no servidor |
| RN12 | Não se exclui filme, sala ou sessão com ingressos vendidos. Filme e sala são desativados, e a sessão é cancelada |
| RN13 | O layout da sala (filas × assentos) não muda depois que existe sessão nela |
| RN14 | Se o usuário criar uma nova reserva na mesma sessão, a reserva pendente anterior dele é cancelada e os assentos são liberados |
| RN15 | O cadastro público cria só `CLIENTE`. Operadores são criados por outro operador (ou pela seed) |

Erros de domínio (Aula 5 de P2): `ErroDominio` → `AssentoIndisponivelError`, `ReservaExpiradaError`, `ReservaInvalidaError`, `IngressoJaUtilizadoError`, `IngressoForaDoHorarioError`, `SessaoSobrepostaError`, `RecursoNaoEncontradoError`, `AcessoNegadoError`, `CredenciaisInvalidasError`. **O domínio não conhece HTTP.** O middleware `tratarErros` faz o mapeamento: 400 Zod, 401, 403, 404, 409 conflito, 410 reserva expirada, 422 regra violada, além de P2002 → 409 e P2003 → 404, como no exemplo do professor.

---

## 8. Backend em camadas

### 8.1 Responsabilidades

| Camada | Faz | Não faz |
|---|---|---|
| `routes/` | monta URL, middlewares (`autenticar`, `exigirPapel('OPERADOR')`) e o método do controller | lógica nenhuma |
| `controllers/` | `Schema.parse(req.body/params/query)`, pega `res.locals.usuario`, chama o service, converte para DTO, define o status HTTP | regra de negócio, Prisma |
| `services/` | todas as regras (RN01–RN15), orquestra a transação, lança erros de domínio, tipagem forte | Express, `req/res`, importar o Prisma |
| `repositories/` | consultas Prisma tipadas e `$queryRaw` (locks, procedure, relatório), aceitam `tx` opcional | decidir regra de negócio |

**Transação que atravessa repositórios sem vazar o Prisma para o service**: um `UnidadeDeTrabalho` (no pacote de repositórios) expõe `executar<T>(fn: (repos: ReposTx) => Promise<T>)`. Ele abre `prisma.$transaction(async tx => ...)` e entrega ao service instâncias dos repositórios ligadas àquele `tx`. O service só enxerga **interfaces** (`IReservaRepository` etc.). Nos testes unitários, usamos implementações em memória (o `RepoMemoria` da Aula 6).

### 8.2 Autenticação e segurança

- `POST /auth/login` → JWT `{ sub, papel }`, validade de 60 min (bcrypt para a senha, a mesma mensagem para usuário inexistente e senha errada).
- O middleware `autenticar` lê `Authorization: Bearer`. O `exigirPapel` responde 403.
- DTOs nunca devolvem `senhaHash`. Erros 500 nunca devolvem stack trace ou mensagem interna.
- `cors` restrito às origens do app em produção, `express.json({ limit: '100kb' })`.
- `JWT_SECRET` e `DATABASE_URL` só no `/etc/cineon.env` do servidor (chmod 600), nunca no Git.

---

## 9. Definição da API (vai para `docs/api.md` + `openapi.yaml`)

Legenda: 🔓 público · 👤 autenticado · 🛠 OPERADOR

| Verbo | Rota | Acesso | Corpo / Query | Respostas |
|---|---|---|---|---|
| POST | `/auth/cadastro` | 🔓 | `{nome, email, senha}` | 201 / 400 / 409 |
| POST | `/auth/login` | 🔓 | `{email, senha}` | 200 `{usuario, accessToken}` / 401 |
| GET | `/auth/me` | 👤 | — | 200 / 401 |
| GET | `/filmes` | 🔓 | `?emCartaz=true&q=` | 200 |
| GET | `/filmes/:id` | 🔓 | — (inclui as próximas sessões) | 200 / 404 |
| POST · PUT · DELETE | `/filmes[/:id]` | 🛠 | `{titulo, sinopse, duracaoMin, classificacao, genero, posterUrl?}` | 201/200/204, 400, 404, 409 (RN12) |
| GET | `/salas` · `/salas/:id` | 🛠 | — (`/:id` inclui o layout) | 200 / 404 |
| POST | `/salas` | 🛠 | `{nome, filas, assentosPorFila}` | 201 / 400 / 409 |
| PUT · DELETE | `/salas/:id` | 🛠 | `{nome?, ativa?}` | 200/204, 409 (RN12/13) |
| GET | `/sessoes` | 🔓 | `?filmeId=&data=AAAA-MM-DD` | 200 |
| GET | `/sessoes/:id` | 🔓 | — | 200 / 404 |
| GET | `/sessoes/:id/assentos` | 🔓 (👤 marca "minha reserva") | — | 200 `{sala, filas:[{fila, assentos:[{id, numero, status}]}]}` |
| POST | `/sessoes` | 🛠 | `{filmeId, salaId, inicio, preco}` (vindos de seletores, não digitados) | 201 / 400 / 409 sobreposição |
| PUT · DELETE | `/sessoes/:id` | 🛠 | `{inicio?, preco?}` / cancelar | 200/204, 409 se já houver venda |
| POST | `/reservas` | 👤 | `{sessaoId, assentoIds[], nomeCliente?}` | 201 `{id, expiraEm, ...}` / **409** assento indisponível |
| GET | `/reservas/:id` | 👤 (dono ou 🛠) | — | 200 / 403 / 404 |
| DELETE | `/reservas/:id` | 👤 (dono ou 🛠) | — (desiste e libera) | 204 |
| POST | `/reservas/:id/pagamento` | 👤 (dono ou 🛠) | `{metodo, itens:[{assentoId, tipo}]}` | 201 `{ingressos}` / **410** expirada / 409 |
| GET | `/ingressos/meus` | 👤 | — | 200 |
| GET | `/ingressos/:codigo` | 👤 (dono ou 🛠) | — | 200 / 404 |
| POST | `/ingressos/validacao` | 🛠 | `{codigo}` | 200 / 404 / 409 já utilizado / 422 fora do horário |
| GET | `/relatorios/ocupacao` | 🛠 | `?inicio=&fim=&filmeId=` | 200 (função SQL) |
| GET | `/relatorios/vendas` | 🛠 | `?inicio=&fim=` | 200 (totais por filme, método, canal e dia) |
| POST | `/usuarios/operadores` | 🛠 | `{nome, email, senha}` | 201 / 409 |

Observações: `metodo = DINHEIRO` só é aceito quando quem paga é operador (balcão). O `valor_total` **nunca** vem do cliente.

---

## 10. Frontend (Expo)

### 10.1 Navegação por papel

```
src/app/
├── _layout.tsx                 # Providers (Tema, Auth) + redireciona pelo papel do token
├── (auth)/login.tsx, cadastro.tsx
├── (cliente)/
│   ├── (tabs)/index.tsx        # Em cartaz (lista de filmes)
│   ├── (tabs)/ingressos.tsx    # Meus ingressos
│   ├── (tabs)/perfil.tsx
│   ├── filme/[id].tsx          # detalhes + sessões agrupadas por dia
│   ├── sessao/[id].tsx         # MAPA DE ASSENTOS
│   ├── checkout/[reservaId].tsx# contagem regressiva, inteira/meia, método, pagar
│   └── ingresso/[codigo].tsx   # ingresso com QR Code
└── (operador)/                 # Drawer: Bilheteria | Gerência
    ├── bilheteria/vender.tsx   # escolhe sessão → mapa → reserva → paga (dinheiro/cartão)
    ├── bilheteria/validar.tsx  # digita o código (ou câmera) → ✅ / ❌ com o motivo
    ├── gerencia/filmes/…       # lista + formulário
    ├── gerencia/salas/…        # nome + filas + assentos por fila (pré-visualiza o layout)
    ├── gerencia/sessoes/…      # seletor de filme, seletor de sala, data/hora, preço
    └── gerencia/relatorios.tsx # período, ocupação por sessão (barras), vendas por método
```

### 10.2 Componentes principais

`MapaAssentos` (grade com "TELA" no topo, filas A..Z, cores livre/selecionado/reservado/vendido/minha reserva, legenda, `accessibilityLabel="Fila C, assento 7, livre"`), `ContagemRegressiva`, `CartaoFilme`, `CartaoIngresso` (com QR), `CampoTexto`, `Seletor`, `Botao`, `Estados`.

### 10.3 ViewModels (hooks)

`useFilmes`, `useSessoes`, `useMapaAssentos` (atualiza a cada 5 s enquanto a tela está em foco e logo após um 409), `useReserva`, `useCheckout`, `useMeusIngressos`, `useValidacao`, `useRelatorio`, `useCrud<T>` para os cadastros.

### 10.4 Usabilidade e segurança (critério "Interface gráfica", peso 3)

- Nenhum formulário pede ID ou total. Filme e sala são escolhidos em seletores. O total vem da API. A sala é cadastrada por "filas × assentos" e o app mostra uma prévia do layout.
- Validação no formulário (campos obrigatórios, formato de e-mail, senha ≥ 6, preço ≥ 0, data futura) **e** no servidor.
- Feedback claro: "Os assentos C7 e C8 acabaram de ser reservados por outra pessoa". O mapa recarrega com os outros assentos já selecionados mantidos.
- Confirmação antes de cancelar sessão, desativar filme ou desistir da reserva.
- Token no SecureStore (memória no Web). No 401 o app apaga o token e volta ao login. Telas de operador ficam inacessíveis para cliente (guard no app **e** 403 na API).
- Nada de dados sensíveis na tela: sem token, sem IDs internos, sem stack trace. **O pagamento é simulado e o app não pede número de cartão.**
- Tema claro/escuro, botões grandes, `KeyboardAvoidingView`, teclado numérico nos campos de número.

---

## 11. Casos de uso (vai para `docs/casos-de-uso.puml` → PNG)

Atores: **Visitante**, **Cliente**, **Operador** (Bilheteria + Gerência) e **Sistema** (relógio, para a expiração).

| Ator | Casos de uso |
|---|---|
| Visitante | UC01 Cadastrar-se · UC02 Fazer login · UC03 Ver filmes em cartaz e sessões · UC04 Ver mapa de assentos |
| Cliente | UC05 Reservar assentos · UC06 Pagar reserva (Pix/Cartão simulado) «include» UC07 Emitir ingressos · UC08 Ver meus ingressos · UC09 Desistir da reserva |
| Operador – Bilheteria | UC10 Vender no balcão «include» UC05, UC06 · UC11 Validar ingresso na entrada |
| Operador – Gerência | UC12 Manter filmes · UC13 Manter salas (gera assentos) · UC14 Manter sessões · UC15 Ver relatório de ocupação · UC16 Ver relatório de vendas · UC17 Cadastrar operador |
| Sistema | UC18 Expirar reservas vencidas |

---

## 12. Testes

| Tipo (Aula 13 de P2) | O quê |
|---|---|
| Unitário | services com repositórios em memória: preço inteira/meia, cálculo do `fim` da sessão, regras de validação de ingresso (janela de horário, já utilizado), limite de assentos |
| Integração | API + PostgreSQL do Docker (como o `api.test.ts` do professor): auth, CRUDs, fluxo completo reserva → pagamento → validação, 401/403/404/409/410 |
| Concorrência | 20 reservas simultâneas no mesmo assento → 1 sucesso. 2 pagamentos simultâneos da mesma reserva → 1 sucesso |
| Fumaça (produção) | script que, após o deploy, chama `/saude`, faz login e consulta o mapa |

O `npm run typecheck` e o `npx expo lint` precisam passar antes de cada entrega.

---

## 13. Deploy (produção) — AWS, como na Aula 12

1. **RDS PostgreSQL 16** (free tier, privado, ligado à EC2). Ativar a extensão `btree_gist` (suportada no RDS).
2. **EC2 Ubuntu** (free tier): Node 22, `git clone`, `npm ci`, `npm run build`, `npx prisma migrate deploy`, `npm run seed` (só na primeira vez).
3. **systemd** `cineon.service` com `EnvironmentFile=/etc/cineon.env` (chmod 600).
4. **nginx** como proxy reverso → `localhost:3000`, **HTTPS com certbot**. O domínio pode ser um subdomínio gratuito (DuckDNS) ou um domínio do grupo.
5. **App**: `EXPO_PUBLIC_API_URL=https://api.<dominio>`. Na apresentação: **Expo Go no celular** + **versão Web** (`npx expo export -p web`) servida pelo mesmo nginx em `https://<dominio>`.
6. `deploy.sh` (pull → ci → build → migrate deploy → restart) e um GitHub Actions opcional rodando `typecheck` + testes a cada push.
7. Cuidados: alerta no AWS Budgets e MFA no root. Depois da nota, encerrar a EC2 e o RDS.

**Plano B** se a AWS travar (cartão, limite de conta): Render (API) + Neon ou Supabase (PostgreSQL gerenciado). O código não muda, só a `DATABASE_URL`.

---

## 14. Artefatos de entrega

- [ ] URL do GitHub (backend + frontend)
- [ ] URL de produção da API e do app Web
- [ ] DER (`docs/der.png`)
- [ ] Diagrama de Casos de Uso (`docs/casos-de-uso.png`)
- [ ] Definição da API (`docs/api.md` + `openapi.yaml` + `requisicoes.http`)
- [ ] Regras de negócio e explicação de concorrência (`docs/regras-de-negocio.md`, `docs/concorrencia.md`)
- [ ] Scripts SQL (as migrações) + prints do `EXPLAIN ANALYZE`
- [ ] Prints das telas (Figma é opcional e fica de fora, a não ser que você queira)
- [ ] README com "como rodar" e usuários de teste

---

## 15. Cronograma (hoje é 09/11 → apresentação em 24/11)

| Fase | Datas | Entregas | "Pronto" quando… |
|---|---|---|---|
| F0 Setup e modelagem | 09–10/11 | monorepo, `.gitignore`, DER, casos de uso, regras. **Criar a conta AWS e o RDS já** (demora) | diagramas revisados por você |
| F1 Banco | 10–12/11 | `schema.prisma`, migrações (geradas + SQL manual), seed com 3 salas, 6 filmes, 7 dias de sessões e vendas para o relatório | `migrate reset` roda limpo. Trigger, procedure e função testadas no psql |
| F2 Backend núcleo | 11–14/11 | auth, CRUDs, reserva, pagamento, ingresso, validação, job de expiração, relatórios, testes (incluindo concorrência) | testes verdes, `requisicoes.http` completo |
| F3 Deploy antecipado | 13–14/11 | API em produção com HTTPS (versão parcial já serve) | `curl https://api…/saude` OK |
| F4 Frontend | 14–20/11 | auth, fluxo do cliente, bilheteria (venda + validação), gerência (CRUDs + relatórios) | fluxo inteiro funcionando contra a produção |
| F5 Acabamento | 20–22/11 | UX, mensagens, revisão de segurança, OpenAPI, README, prints, `EXPLAIN` | checklist da seção 14 completo |
| F6 Ensaio | 23/11 | ensaio da demo **em produção**, com 2 celulares | roteiro da seção 17 roda sem falhas |

Divisão sugerida da equipe (cada um apresenta a sua parte no dia 24/11):

| Frente | Responsável sugerido |
|---|---|
| Banco e SQL (modelagem, migrações, trigger/procedure/função, índices, EXPLAIN) | Alexandre Reitemeyer |
| Backend e regras (services, concorrência, testes) | Lucas Santos Magro |
| App do cliente (filmes, mapa, checkout, ingressos) | Beatriz Miranda |
| App do operador (bilheteria, gerência, relatórios) + deploy AWS | Gabriel Nassinger |

---

## 16. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| O Prisma Migrate "não conhece" EXCLUDE, índice parcial e triggers e pode tentar removê-los num `migrate dev` futuro (drift) | **Spike no dia 1 da F1**: criar o SQL manual e rodar outro `migrate dev` para conferir o diff. Se houver drift, declarar o índice parcial de outro jeito ou mover o objeto para uma migração final só de SQL. Sempre revisar o `migration.sql` gerado antes de aplicar |
| AWS: cadastro, cartão, demora do RDS | Começar na F0. O plano B (Render + Neon) fica documentado |
| HTTPS e domínio para o Expo Go | DuckDNS + certbot. Testar no celular na F3 |
| Pouco tempo (15 dias) | Deploy antecipado (F3). Extras (câmera, tempo real via WebSocket, Figma) só depois do núcleo |
| Versões novas (Expo 57, Prisma 7, TS 7) | Usar exatamente as versões do `package.json` do professor e consultar a documentação versionada da Expo (o `AGENTS.md` do exemplo recomenda isso) |
| Diferença de fuso entre servidor e app | `timestamptz` no banco, ISO-8601 com `Z` na API, formatação `America/Sao_Paulo` no app |

---

## 17. Roteiro da demonstração (24/11, em produção)

1. Abrir o app Web e o Expo Go apontando para `https://…`. Mostrar que é produção.
2. **Gerência**: criar uma sala "Sala Demo" 5×8 (assentos gerados pela procedure), criar uma sessão (o mapa é gerado pela trigger). Tentar uma sessão sobreposta → erro amigável (service + `EXCLUDE`).
3. **Cliente A** (celular 1) e **Cliente B** (celular 2) abrem a mesma sessão e tocam **o mesmo assento** ao mesmo tempo → um consegue e o outro recebe "assento acabou de ser reservado". Em seguida, rodar `npm run demo:concorrencia` (20 requisições simultâneas → 1 sucesso).
4. Cliente B reserva outro assento e não paga → depois de 2 min (`.env` da demo) o assento volta a ficar livre no mapa.
5. Cliente A paga com Pix → ingresso com código e QR.
6. **Bilheteria**: venda no balcão em dinheiro. Em seguida, validar o ingresso do Cliente A → ✅. Validar de novo → "já utilizado às 19:42".
7. **Relatórios**: ocupação por sessão (a função SQL com 5 tabelas) e vendas por método e canal.
8. Mostrar rapidamente: as camadas no código, `schema.prisma`, as migrações com trigger/procedure, `log_auditoria`, o teste de concorrência verde.

---

## 18. O que preciso de você para começar

1. Aprovar (ou ajustar) as decisões **D1–D6** da seção 0.
2. Confirmar se o grupo já tem **conta AWS** (ou se uso o plano B) e se há um domínio.
3. Dizer se quer que eu já **faça commits por fase** neste repositório (só começo depois da sua aprovação).
