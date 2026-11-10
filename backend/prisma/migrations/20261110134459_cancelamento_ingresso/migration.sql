-- DropIndex
DROP INDEX "ingressos_sessao_id_assento_id_key";

-- CreateIndex
CREATE INDEX "ingressos_sessao_id_assento_id_idx" ON "ingressos"("sessao_id", "assento_id");

-- Última barreira contra venda dupla: só um ingresso ativo por assento da sessão.
-- Cancelados ficam de fora do índice, então o assento pode ser vendido de novo.
CREATE UNIQUE INDEX ux_ingressos_assento_ativo ON ingressos (sessao_id, assento_id) WHERE status <> 'CANCELADO';
