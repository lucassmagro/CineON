-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('CLIENTE', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusAssento" AS ENUM ('LIVRE', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'PAGA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CanalVenda" AS ENUM ('ONLINE', 'BALCAO');

-- CreateEnum
CREATE TYPE "StatusIngresso" AS ENUM ('VALIDO', 'UTILIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'CLIENTE',
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filmes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "sinopse" TEXT NOT NULL DEFAULT '',
    "duracao_min" INTEGER NOT NULL,
    "classificacao" VARCHAR(10) NOT NULL,
    "genero" VARCHAR(50) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assentos" (
    "id" SERIAL NOT NULL,
    "sala_id" INTEGER NOT NULL,
    "fila" VARCHAR(2) NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "assentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "id" SERIAL NOT NULL,
    "filme_id" INTEGER NOT NULL,
    "sala_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assentos_sessao" (
    "sessao_id" INTEGER NOT NULL,
    "assento_id" INTEGER NOT NULL,
    "status" "StatusAssento" NOT NULL DEFAULT 'LIVRE',
    "reserva_id" INTEGER,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assentos_sessao_pkey" PRIMARY KEY ("sessao_id","assento_id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',
    "canal" "CanalVenda" NOT NULL DEFAULT 'ONLINE',
    "nome_cliente" VARCHAR(100),
    "criada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "transacao" VARCHAR(36) NOT NULL,
    "pago_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingressos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(12) NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "assento_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'VALIDO',
    "emitido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilizado_em" TIMESTAMPTZ(3),
    "validado_por_id" INTEGER,

    CONSTRAINT "ingressos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "tabela" VARCHAR(50) NOT NULL,
    "operacao" VARCHAR(10) NOT NULL,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "ocorrido_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "salas_nome_key" ON "salas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "assentos_sala_id_fila_numero_key" ON "assentos"("sala_id", "fila", "numero");

-- CreateIndex
CREATE INDEX "sessoes_filme_id_inicio_idx" ON "sessoes"("filme_id", "inicio");

-- CreateIndex
CREATE INDEX "sessoes_inicio_idx" ON "sessoes"("inicio");

-- CreateIndex
CREATE INDEX "assentos_sessao_reserva_id_idx" ON "assentos_sessao"("reserva_id");

-- CreateIndex
CREATE INDEX "reservas_usuario_id_criada_em_idx" ON "reservas"("usuario_id", "criada_em" DESC);

-- CreateIndex
CREATE INDEX "reservas_sessao_id_idx" ON "reservas"("sessao_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_reserva_id_key" ON "pagamentos"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_transacao_key" ON "pagamentos"("transacao");

-- CreateIndex
CREATE UNIQUE INDEX "ingressos_codigo_key" ON "ingressos"("codigo");

-- CreateIndex
CREATE INDEX "ingressos_reserva_id_idx" ON "ingressos"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingressos_sessao_id_assento_id_key" ON "ingressos"("sessao_id", "assento_id");

-- CreateIndex
CREATE INDEX "log_auditoria_tabela_ocorrido_em_idx" ON "log_auditoria"("tabela", "ocorrido_em");

-- AddForeignKey
ALTER TABLE "assentos" ADD CONSTRAINT "assentos_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "salas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_filme_id_fkey" FOREIGN KEY ("filme_id") REFERENCES "filmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "salas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assentos_sessao" ADD CONSTRAINT "assentos_sessao_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assentos_sessao" ADD CONSTRAINT "assentos_sessao_assento_id_fkey" FOREIGN KEY ("assento_id") REFERENCES "assentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assentos_sessao" ADD CONSTRAINT "assentos_sessao_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "sessoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_sessao_id_assento_id_fkey" FOREIGN KEY ("sessao_id", "assento_id") REFERENCES "assentos_sessao"("sessao_id", "assento_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
