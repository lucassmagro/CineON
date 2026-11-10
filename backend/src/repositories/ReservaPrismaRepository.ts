import type { Prisma } from "../../generated/prisma/client.js";
import type { CanalVenda, Reserva, ReservaDetalhada, StatusReserva } from "../domain/modelos.js";
import type { ReservaRepository } from "./contratos.js";
import { incluirSessaoDetalhada, paraNumero, sessaoParaDominio, type Db } from "./db.js";

type LinhaReserva = {
  id: number;
  usuarioId: number;
  sessaoId: number;
  status: StatusReserva;
  canal: CanalVenda;
  nomeCliente: string | null;
  criadaEm: Date;
  expiraEm: Date;
  valorTotal: Prisma.Decimal | number | string;
};

function reservaParaDominio(r: LinhaReserva): Reserva {
  return { ...r, valorTotal: paraNumero(r.valorTotal) };
}

const COLUNAS_RESERVA = `
  id, usuario_id AS "usuarioId", sessao_id AS "sessaoId", status::text AS "status",
  canal::text AS "canal", nome_cliente AS "nomeCliente", criada_em AS "criadaEm",
  expira_em AS "expiraEm", valor_total AS "valorTotal"`;

export class ReservaPrismaRepository implements ReservaRepository {
  constructor(private readonly db: Db) {}

  async criar(dados: {
    usuarioId: number;
    sessaoId: number;
    canal: CanalVenda;
    nomeCliente: string | null;
    criadaEm: Date;
    expiraEm: Date;
    valorTotal: number;
  }): Promise<Reserva> {
    const r = await this.db.reserva.create({ data: dados });
    return reservaParaDominio(r);
  }

  async buscarDetalhada(id: number): Promise<ReservaDetalhada | null> {
    const r = await this.db.reserva.findUnique({
      where: { id },
      include: {
        sessao: { include: incluirSessaoDetalhada },
        assentos: { include: { assento: { select: { fila: true, numero: true } } } },
        ingressos: { include: { assentoSessao: { include: { assento: { select: { fila: true, numero: true } } } } } },
      },
    });
    if (!r) return null;
    const ordenar = <T extends { fila: string; numero: number }>(lista: T[]) =>
      lista.sort((a, b) => a.fila.localeCompare(b.fila) || a.numero - b.numero);
    return {
      ...reservaParaDominio(r),
      sessao: sessaoParaDominio(r.sessao),
      assentos: ordenar(
        r.assentos.map((a) => ({ assentoId: a.assentoId, fila: a.assento.fila, numero: a.assento.numero })),
      ),
      ingressos: ordenar(
        r.ingressos.map((i) => ({
          id: i.id,
          codigo: i.codigo,
          reservaId: i.reservaId,
          sessaoId: i.sessaoId,
          assentoId: i.assentoId,
          valor: paraNumero(i.valor),
          status: i.status,
          emitidoEm: i.emitidoEm,
          utilizadoEm: i.utilizadoEm,
          fila: i.assentoSessao.assento.fila,
          numero: i.assentoSessao.assento.numero,
        })),
      ),
    };
  }

  async travar(id: number): Promise<Reserva | null> {
    const linhas = await this.db.$queryRawUnsafe<LinhaReserva[]>(
      `SELECT ${COLUNAS_RESERVA} FROM reservas WHERE id = $1 FOR UPDATE`,
      id,
    );
    return linhas[0] ? reservaParaDominio(linhas[0]) : null;
  }

  async travarPendenteDoUsuario(usuarioId: number, sessaoId: number): Promise<Reserva | null> {
    const linhas = await this.db.$queryRawUnsafe<LinhaReserva[]>(
      `SELECT ${COLUNAS_RESERVA} FROM reservas
        WHERE usuario_id = $1 AND sessao_id = $2 AND status = 'PENDENTE'
        ORDER BY id FOR UPDATE`,
      usuarioId,
      sessaoId,
    );
    return linhas[0] ? reservaParaDominio(linhas[0]) : null;
  }

  async atualizarStatus(id: number, status: StatusReserva, valorTotal?: number): Promise<void> {
    await this.db.reserva.update({
      where: { id },
      data: { status, ...(valorTotal !== undefined ? { valorTotal } : {}) },
    });
  }

  // SKIP LOCKED: se a reserva estiver sendo paga nesse momento, o job pula ela
  async travarVencidas(agora: Date, limite: number): Promise<number[]> {
    const linhas = await this.db.$queryRaw<{ id: number }[]>`
      SELECT id FROM reservas
       WHERE status = 'PENDENTE' AND expira_em <= ${agora}
       ORDER BY expira_em
       LIMIT ${limite}
         FOR UPDATE SKIP LOCKED`;
    return linhas.map((l) => l.id);
  }

  async marcarStatus(ids: number[], status: StatusReserva): Promise<number> {
    if (ids.length === 0) return 0;
    const r = await this.db.reserva.updateMany({ where: { id: { in: ids } }, data: { status } });
    return r.count;
  }
}
