-- Objetos que o schema.prisma não consegue declarar (migração criada com --create-only).
-- As regras de negócio continuam nos services; aqui ficam constraints, o mapa da
-- sessão, a auditoria e a consulta do relatório.

-- precisa pro EXCLUDE usar = com && no mesmo índice GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CHECKs
ALTER TABLE filmes   ADD CONSTRAINT ck_filmes_duracao_positiva CHECK (duracao_min > 0);
ALTER TABLE assentos ADD CONSTRAINT ck_assentos_numero_positivo CHECK (numero > 0);
ALTER TABLE assentos ADD CONSTRAINT ck_assentos_fila_formato CHECK (fila ~ '^[A-Z]{1,2}$');
ALTER TABLE sessoes  ADD CONSTRAINT ck_sessoes_preco_nao_negativo CHECK (preco >= 0);
ALTER TABLE sessoes  ADD CONSTRAINT ck_sessoes_fim_apos_inicio CHECK (fim > inicio);
ALTER TABLE reservas ADD CONSTRAINT ck_reservas_expira_apos_criacao CHECK (expira_em > criada_em);
ALTER TABLE reservas ADD CONSTRAINT ck_reservas_valor_nao_negativo CHECK (valor_total >= 0);
ALTER TABLE pagamentos ADD CONSTRAINT ck_pagamentos_valor_nao_negativo CHECK (valor >= 0);
ALTER TABLE ingressos  ADD CONSTRAINT ck_ingressos_valor_nao_negativo CHECK (valor >= 0);

-- assento livre não tem reserva; reservado ou vendido sempre tem
ALTER TABLE assentos_sessao ADD CONSTRAINT ck_assentos_sessao_reserva_coerente
  CHECK ((status = 'LIVRE') = (reserva_id IS NULL));

ALTER TABLE ingressos ADD CONSTRAINT ck_ingressos_utilizado_com_data
  CHECK (status <> 'UTILIZADO' OR utilizado_em IS NOT NULL);

-- impede duas sessões na mesma sala com horários sobrepostos
ALTER TABLE sessoes ADD CONSTRAINT ex_sessoes_sala_sem_sobreposicao
  EXCLUDE USING gist (sala_id WITH =, tstzrange(inicio, fim, '[)') WITH &&);

-- o job de expiração só olha as reservas pendentes, então o índice só guarda essas
CREATE INDEX ix_reservas_pendentes_expira_em ON reservas (expira_em) WHERE status = 'PENDENTE';

-- ao criar uma sessão, cria uma linha LIVRE em assentos_sessao pra cada assento da sala
CREATE OR REPLACE FUNCTION fn_trg_sessao_gera_mapa() RETURNS trigger AS $$
BEGIN
  INSERT INTO assentos_sessao (sessao_id, assento_id, status, atualizado_em)
  SELECT NEW.id, a.id, 'LIVRE', now()
    FROM assentos a
   WHERE a.sala_id = NEW.sala_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessao_gera_mapa
AFTER INSERT ON sessoes
FOR EACH ROW EXECUTE FUNCTION fn_trg_sessao_gera_mapa();

-- log de tudo que acontece com reservas e ingressos
CREATE OR REPLACE FUNCTION fn_trg_auditoria() RETURNS trigger AS $$
BEGIN
  INSERT INTO log_auditoria (tabela, operacao, dados_antigos, dados_novos, ocorrido_em)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_reservas
AFTER INSERT OR UPDATE OR DELETE ON reservas
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria();

CREATE TRIGGER trg_auditoria_ingressos
AFTER INSERT OR UPDATE OR DELETE ON ingressos
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria();

-- gera os assentos da sala (filas A, B, C... com números de 1 a N)
CREATE OR REPLACE PROCEDURE sp_gerar_assentos_sala(p_sala_id int, p_filas int, p_por_fila int)
LANGUAGE plpgsql AS $$
DECLARE
  v_fila int;
  v_numero int;
BEGIN
  IF p_filas < 1 OR p_filas > 26 OR p_por_fila < 1 THEN
    RAISE EXCEPTION 'Layout inválido: % filas x % assentos', p_filas, p_por_fila
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM sessoes WHERE sala_id = p_sala_id) THEN
    RAISE EXCEPTION 'A sala % já possui sessões; o layout não pode ser alterado', p_sala_id
      USING ERRCODE = 'restrict_violation';
  END IF;

  DELETE FROM assentos WHERE sala_id = p_sala_id;

  FOR v_fila IN 1..p_filas LOOP
    FOR v_numero IN 1..p_por_fila LOOP
      INSERT INTO assentos (sala_id, fila, numero)
      VALUES (p_sala_id, chr(64 + v_fila), v_numero);  -- 65 = 'A'
    END LOOP;
  END LOOP;
END;
$$;

-- relatório de vendas e ocupação por sessão. As CTEs agregam assentos e
-- ingressos antes do join pra juntar menos linhas.
CREATE OR REPLACE FUNCTION fn_relatorio_ocupacao(
  p_inicio   timestamptz,
  p_fim      timestamptz,
  p_filme_id int DEFAULT NULL
)
RETURNS TABLE (
  sessao_id     int,
  filme_id      int,
  filme         varchar,
  sala          varchar,
  inicio        timestamptz,
  preco         numeric,
  capacidade    int,
  vendidos      int,
  utilizados    int,
  taxa_ocupacao numeric,
  receita       numeric
)
LANGUAGE sql STABLE AS $$
  WITH capacidade_sala AS (
    SELECT a.sala_id, count(*)::int AS capacidade
      FROM assentos a
     GROUP BY a.sala_id
  ),
  vendas_sessao AS (
    SELECT i.sessao_id,
           count(*)::int                                     AS vendidos,
           count(*) FILTER (WHERE i.status = 'UTILIZADO')::int AS utilizados,
           sum(i.valor)                                      AS receita
      FROM ingressos i
     WHERE i.status <> 'CANCELADO'
     GROUP BY i.sessao_id
  )
  SELECT s.id,
         f.id,
         f.titulo,
         sa.nome,
         s.inicio,
         s.preco,
         COALESCE(c.capacidade, 0),
         COALESCE(v.vendidos, 0),
         COALESCE(v.utilizados, 0),
         ROUND(COALESCE(v.vendidos, 0) * 100.0 / NULLIF(c.capacidade, 0), 2),
         COALESCE(v.receita, 0)
    FROM sessoes s
    JOIN filmes f              ON f.id = s.filme_id
    JOIN salas sa              ON sa.id = s.sala_id
    LEFT JOIN capacidade_sala c ON c.sala_id = s.sala_id
    LEFT JOIN vendas_sessao v   ON v.sessao_id = s.id
   WHERE s.inicio >= p_inicio
     AND s.inicio <  p_fim
     AND (p_filme_id IS NULL OR s.filme_id = p_filme_id)
   ORDER BY s.inicio, sa.nome;
$$;
