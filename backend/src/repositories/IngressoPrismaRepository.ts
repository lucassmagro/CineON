import type { Prisma } from "../../generated/prisma/client.js";
import type { IngressoDetalhado } from "../domain/modelos.js";
import type { IngressoRepository } from "./contratos.js";
import { incluirSessaoDetalhada, paraNumero, sessaoParaDominio, type Db } from "./db.js";

const incluirDetalhes = {
  reserva: { select: { usuarioId: true, nomeCliente: true } },
  assentoSessao: {
    select: {
      assento: { select: { fila: true, numero: true } },
      sessao: { include: incluirSessaoDetalhada },
    },
  },
} satisfies Prisma.IngressoInclude;

type IngressoComDetalhes = Prisma.IngressoGetPayload<{ include: typeof incluirDetalhes }>;

function paraDominio(i: IngressoComDetalhes): IngressoDetalhado {
  return {
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
    donoId: i.reserva.usuarioId,
    nomeCliente: i.reserva.nomeCliente,
    sessao: sessaoParaDominio(i.assentoSessao.sessao),
  };
}

export class IngressoPrismaRepository implements IngressoRepository {
  constructor(private readonly db: Db) {}

  async criarVarios(
    itens: { codigo: string; reservaId: number; sessaoId: number; assentoId: number; valor: number; emitidoEm: Date }[],
  ): Promise<void> {
    // se algo der errado no service, o UNIQUE (sessao_id, assento_id) barra a venda dupla aqui
    await this.db.ingresso.createMany({ data: itens });
  }

  async listarDoUsuario(usuarioId: number): Promise<IngressoDetalhado[]> {
    const lista = await this.db.ingresso.findMany({
      where: { reserva: { usuarioId } },
      include: incluirDetalhes,
      orderBy: [{ emitidoEm: "desc" }, { id: "asc" }],
    });
    return lista.map(paraDominio);
  }

  async buscarPorCodigo(codigo: string): Promise<IngressoDetalhado | null> {
    const i = await this.db.ingresso.findUnique({ where: { codigo }, include: incluirDetalhes });
    return i ? paraDominio(i) : null;
  }

  async travarPorCodigo(codigo: string): Promise<IngressoDetalhado | null> {
    // trava o ingresso pra duas validações ao mesmo tempo não passarem as duas
    const travado = await this.db.$queryRaw<{ id: number }[]>`
      SELECT id FROM ingressos WHERE codigo = ${codigo} FOR UPDATE`;
    const id = travado[0]?.id;
    if (id === undefined) return null;
    const i = await this.db.ingresso.findUnique({ where: { id }, include: incluirDetalhes });
    return i ? paraDominio(i) : null;
  }

  async marcarUtilizado(id: number, quando: Date, operadorId: number): Promise<void> {
    await this.db.ingresso.update({
      where: { id },
      data: { status: "UTILIZADO", utilizadoEm: quando, validadoPorId: operadorId },
    });
  }
}
