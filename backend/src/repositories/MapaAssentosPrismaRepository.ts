import type { AssentoDaSessao, StatusAssento, StatusReserva } from "../domain/modelos.js";
import type { MapaAssentosRepository } from "./contratos.js";
import type { Db } from "./db.js";

type LinhaTravada = {
  assentoId: number;
  fila: string;
  numero: number;
  status: StatusAssento;
  reservaId: number | null;
  reservaStatus: StatusReserva | null;
  reservaExpiraEm: Date | null;
  reservaUsuarioId: number | null;
};

export class MapaAssentosPrismaRepository implements MapaAssentosRepository {
  constructor(private readonly db: Db) {}

  async listar(sessaoId: number): Promise<AssentoDaSessao[]> {
    const linhas = await this.db.assentoSessao.findMany({
      where: { sessaoId },
      include: {
        assento: { select: { fila: true, numero: true } },
        reserva: { select: { status: true, expiraEm: true, usuarioId: true } },
      },
      orderBy: [{ assento: { fila: "asc" } }, { assento: { numero: "asc" } }],
    });
    return linhas.map((l) => ({
      assentoId: l.assentoId,
      fila: l.assento.fila,
      numero: l.assento.numero,
      status: l.status,
      reservaId: l.reservaId,
      reservaStatus: l.reserva?.status ?? null,
      reservaExpiraEm: l.reserva?.expiraEm ?? null,
      reservaUsuarioId: l.reserva?.usuarioId ?? null,
    }));
  }

  // Trava as linhas com FOR UPDATE, sempre ordenando por assento_id pra evitar deadlock.
  //
  // O lock e a leitura ficam em comandos separados de propósito. Com tudo num
  // SELECT só (com JOIN em reservas), quem ficava esperando o lock lia a tabela
  // reservas com o snapshot antigo e não via a reserva que a outra transação
  // acabou de criar. O teste dos 20 cliques simultâneos pegou isso.
  async travar(sessaoId: number, assentoIds: number[]): Promise<AssentoDaSessao[]> {
    await this.db.$queryRaw`
      SELECT assento_id
        FROM assentos_sessao
       WHERE sessao_id = ${sessaoId}::int
         AND assento_id = ANY(${assentoIds}::int[])
       ORDER BY assento_id
         FOR UPDATE`;
    return this.ler(sessaoId, assentoIds);
  }

  async travarDaReserva(reservaId: number): Promise<AssentoDaSessao[]> {
    const travados = await this.db.$queryRaw<{ sessao_id: number; assento_id: number }[]>`
      SELECT sessao_id, assento_id
        FROM assentos_sessao
       WHERE reserva_id = ${reservaId}::int
       ORDER BY assento_id
         FOR UPDATE`;
    const sessaoId = travados[0]?.sessao_id;
    if (sessaoId === undefined) return [];
    return this.ler(sessaoId, travados.map((t) => t.assento_id));
  }

  private ler(sessaoId: number, assentoIds: number[]): Promise<AssentoDaSessao[]> {
    return this.db.$queryRaw<LinhaTravada[]>`
      SELECT a.assento_id      AS "assentoId",
             s.fila            AS "fila",
             s.numero          AS "numero",
             a.status::text    AS "status",
             a.reserva_id      AS "reservaId",
             r.status::text    AS "reservaStatus",
             r.expira_em       AS "reservaExpiraEm",
             r.usuario_id      AS "reservaUsuarioId"
        FROM assentos_sessao a
        JOIN assentos s      ON s.id = a.assento_id
        LEFT JOIN reservas r ON r.id = a.reserva_id
       WHERE a.sessao_id = ${sessaoId}::int
         AND a.assento_id = ANY(${assentoIds}::int[])
       ORDER BY a.assento_id`;
  }

  async marcarReservados(sessaoId: number, assentoIds: number[], reservaId: number): Promise<number> {
    const r = await this.db.assentoSessao.updateMany({
      where: { sessaoId, assentoId: { in: assentoIds } },
      data: { status: "RESERVADO", reservaId },
    });
    return r.count;
  }

  async marcarVendidos(reservaId: number): Promise<number> {
    const r = await this.db.assentoSessao.updateMany({
      where: { reservaId, status: "RESERVADO" },
      data: { status: "VENDIDO" },
    });
    return r.count;
  }

  // ingresso cancelado: o assento volta a ficar livre pra venda
  async liberarVendidos(sessaoId: number, assentoIds: number[]): Promise<number> {
    if (assentoIds.length === 0) return 0;
    const r = await this.db.assentoSessao.updateMany({
      where: { sessaoId, assentoId: { in: assentoIds }, status: "VENDIDO" },
      data: { status: "LIVRE", reservaId: null },
    });
    return r.count;
  }

  async liberarDasReservas(reservaIds: number[]): Promise<number> {
    if (reservaIds.length === 0) return 0;
    const r = await this.db.assentoSessao.updateMany({
      where: { reservaId: { in: reservaIds }, status: "RESERVADO" },
      data: { status: "LIVRE", reservaId: null },
    });
    return r.count;
  }
}
