# CineON — Diagrama Entidade-Relacionamento

Modelo lógico implementado em [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) e nas migrações em [backend/prisma/migrations](../backend/prisma/migrations).
O diagrama abaixo usa Mermaid, que o GitHub renderiza automaticamente.

```mermaid
erDiagram
    USUARIOS ||--o{ RESERVAS : "faz (cliente online ou operador no balcão)"
    USUARIOS ||--o{ INGRESSOS : "valida na entrada (operador)"
    FILMES   ||--o{ SESSOES : "é exibido em"
    SALAS    ||--o{ ASSENTOS : "possui (conjunto fixo)"
    SALAS    ||--o{ SESSOES : "recebe"
    SESSOES  ||--o{ ASSENTOS_SESSAO : "tem um mapa"
    ASSENTOS ||--o{ ASSENTOS_SESSAO : "aparece no mapa de"
    SESSOES  ||--o{ RESERVAS : "recebe"
    RESERVAS |o--o{ ASSENTOS_SESSAO : "segura"
    RESERVAS ||--o| PAGAMENTOS : "é paga por (1:1)"
    RESERVAS ||--o{ INGRESSOS : "emite"
    ASSENTOS_SESSAO ||--o| INGRESSOS : "vendido como (1:1)"

    USUARIOS {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash "bcrypt"
        enum papel "CLIENTE | OPERADOR"
        timestamptz criado_em
    }
    FILMES {
        int id PK
        varchar titulo
        text sinopse
        int duracao_min "CHECK > 0"
        varchar classificacao
        varchar genero
        varchar poster_url "opcional"
        bool ativo
        timestamptz criado_em
    }
    SALAS {
        int id PK
        varchar nome UK
        bool ativa
    }
    ASSENTOS {
        int id PK
        int sala_id FK
        varchar fila "CHECK A..Z"
        int numero "CHECK > 0"
    }
    SESSOES {
        int id PK
        int filme_id FK
        int sala_id FK
        timestamptz inicio
        timestamptz fim "CHECK fim > inicio"
        decimal preco "CHECK >= 0"
    }
    ASSENTOS_SESSAO {
        int sessao_id PK, FK
        int assento_id PK, FK
        enum status "LIVRE | RESERVADO | VENDIDO"
        int reserva_id FK "NULL se LIVRE (CHECK)"
        timestamptz atualizado_em
    }
    RESERVAS {
        int id PK
        int usuario_id FK
        int sessao_id FK
        enum status "PENDENTE | PAGA | EXPIRADA | CANCELADA"
        enum canal "ONLINE | BALCAO"
        varchar nome_cliente "balcão, opcional"
        timestamptz criada_em
        timestamptz expira_em "CHECK > criada_em"
        decimal valor_total "CHECK >= 0"
    }
    PAGAMENTOS {
        int id PK
        int reserva_id FK, UK
        decimal valor "CHECK >= 0"
        varchar transacao UK "simulada (UUID)"
        timestamptz pago_em
    }
    INGRESSOS {
        int id PK
        varchar codigo UK "10 caracteres"
        int reserva_id FK
        int sessao_id FK "FK composta -> assentos_sessao"
        int assento_id FK "UNIQUE (sessao_id, assento_id)"
        decimal valor "CHECK >= 0"
        enum status "VALIDO | UTILIZADO | CANCELADO"
        timestamptz emitido_em
        timestamptz utilizado_em
        int validado_por_id FK
    }
    LOG_AUDITORIA {
        bigint id PK
        varchar tabela
        varchar operacao
        jsonb dados_antigos
        jsonb dados_novos
        timestamptz ocorrido_em
    }
```

## Chaves, constraints e índices

| Tabela | Objeto | Tipo | Para quê |
|---|---|---|---|
| todas | `*_pkey` | PK | identificação |
| `usuarios` | `email` | UNIQUE | login e cadastro sem duplicidade |
| `salas` | `nome` | UNIQUE | nomes distintos |
| `assentos` | `(sala_id, fila, numero)` | UNIQUE | conjunto fixo de assentos da sala |
| `sessoes` | `ex_sessoes_sala_sem_sobreposicao` | **EXCLUDE (GiST)** | duas sessões não ocupam a mesma sala em horários sobrepostos |
| `sessoes` | `(filme_id, inicio)`, `(inicio)` | índices B-Tree | sessões de um filme e listagem por período |
| `assentos_sessao` | `(sessao_id, assento_id)` | **PK composta** | **um único estado por assento em cada sessão** |
| `assentos_sessao` | `ck_assentos_sessao_reserva_coerente` | CHECK | LIVRE ⇔ sem reserva |
| `assentos_sessao` | `(reserva_id)` | índice | liberar/vender os assentos de uma reserva |
| `reservas` | `ix_reservas_pendentes_expira_em` | **índice parcial** | o job de expiração só olha as reservas pendentes |
| `reservas` | `(usuario_id, criada_em DESC)`, `(sessao_id)` | índices | consultas por usuário e por sessão |
| `pagamentos` | `reserva_id` | UNIQUE (1:1) | uma reserva tem no máximo um pagamento |
| `ingressos` | `codigo` | UNIQUE | código único, usado na validação |
| `ingressos` | `(sessao_id, assento_id)` | **UNIQUE + FK composta** | **o banco recusa um segundo ingresso para o mesmo assento da mesma sessão** |
| vários | `ck_*` | CHECK | preço, duração, número e valores não negativos; datas coerentes |

## Objetos programáveis

| Objeto | Tipo | Descrição |
|---|---|---|
| `trg_sessao_gera_mapa` | Trigger AFTER INSERT em `sessoes` | gera o mapa da sessão: uma linha LIVRE em `assentos_sessao` por assento da sala |
| `trg_auditoria_reservas` / `trg_auditoria_ingressos` | Triggers AFTER INSERT/UPDATE/DELETE | gravam o antes e o depois (JSONB) em `log_auditoria` |
| `sp_gerar_assentos_sala(sala, filas, por_fila)` | **Stored procedure** (`CALL`) | gera o conjunto fixo de assentos da sala (filas A, B, C… × 1..N) |
| `fn_relatorio_ocupacao(inicio, fim, filme)` | Função SQL com CTEs | relatório gerencial com **5 tabelas**: sessões, filmes, salas, assentos e ingressos |
