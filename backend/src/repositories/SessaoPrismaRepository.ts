import type { SessaoDetalhada } from "../domain/modelos.js";
import type { FiltroSessoes, SessaoRepository } from "./contratos.js";
import { incluirSessaoDetalhada, sessaoParaDominio, type Db } from "./db.js";

export class SessaoPrismaRepository implements SessaoRepository {
  constructor(private readonly db: Db) {}

  async listar(filtro: FiltroSessoes): Promise<SessaoDetalhada[]> {
    const sessoes = await this.db.sessao.findMany({
      where: {
        ...(filtro.filmeId ? { filmeId: filtro.filmeId } : {}),
        ...(filtro.salaId ? { salaId: filtro.salaId } : {}),
        inicio: {
          ...(filtro.de ? { gte: filtro.de } : {}),
          ...(filtro.ate ? { lt: filtro.ate } : {}),
        },
      },
      include: incluirSessaoDetalhada,
      orderBy: [{ inicio: "asc" }, { salaId: "asc" }],
    });
    return sessoes.map(sessaoParaDominio);
  }

  async buscarPorId(id: number): Promise<SessaoDetalhada | null> {
    const s = await this.db.sessao.findUnique({ where: { id }, include: incluirSessaoDetalhada });
    return s ? sessaoParaDominio(s) : null;
  }

  async existeSobreposicao(salaId: number, inicio: Date, fim: Date, ignorarSessaoId?: number): Promise<boolean> {
    // dois intervalos se sobrepõem se um começa antes do outro terminar
    const total = await this.db.sessao.count({
      where: {
        salaId,
        inicio: { lt: fim },
        fim: { gt: inicio },
        ...(ignorarSessaoId ? { id: { not: ignorarSessaoId } } : {}),
      },
    });
    return total > 0;
  }

  async criar(dados: { filmeId: number; salaId: number; inicio: Date; fim: Date; preco: number }): Promise<SessaoDetalhada> {
    const s = await this.db.sessao.create({ data: dados, include: incluirSessaoDetalhada });
    return sessaoParaDominio(s);
  }

  async atualizarPreco(id: number, preco: number): Promise<SessaoDetalhada> {
    const s = await this.db.sessao.update({ where: { id }, data: { preco }, include: incluirSessaoDetalhada });
    return sessaoParaDominio(s);
  }

  async remover(id: number): Promise<void> {
    await this.db.sessao.delete({ where: { id } }); // o mapa vai junto (cascade)
  }

  contarReservas(id: number): Promise<number> {
    return this.db.reserva.count({ where: { sessaoId: id } });
  }
}
