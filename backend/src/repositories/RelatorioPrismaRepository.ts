import type { LinhaOcupacao, VendasPorCanal } from "../domain/modelos.js";
import type { RelatorioRepository } from "./contratos.js";
import { paraNumero, type Db } from "./db.js";

type LinhaSql = {
  sessao_id: number;
  filme_id: number;
  filme: string;
  sala: string;
  inicio: Date;
  preco: string | number;
  capacidade: number;
  vendidos: number;
  utilizados: number;
  taxa_ocupacao: string | number | null;
  receita: string | number;
};

export class RelatorioPrismaRepository implements RelatorioRepository {
  constructor(private readonly db: Db) {}

  async ocupacao(inicio: Date, fim: Date, filmeId?: number): Promise<LinhaOcupacao[]> {
    // função criada na migração objetos_sql
    const linhas = await this.db.$queryRaw<LinhaSql[]>`
      SELECT * FROM fn_relatorio_ocupacao(${inicio}::timestamptz, ${fim}::timestamptz, ${filmeId ?? null}::int)`;
    return linhas.map((l) => ({
      sessaoId: l.sessao_id,
      filmeId: l.filme_id,
      filme: l.filme,
      sala: l.sala,
      inicio: l.inicio,
      preco: paraNumero(l.preco),
      capacidade: l.capacidade,
      vendidos: l.vendidos,
      utilizados: l.utilizados,
      taxaOcupacao: l.taxa_ocupacao === null ? 0 : paraNumero(l.taxa_ocupacao),
      receita: paraNumero(l.receita),
    }));
  }

  async vendasPorCanal(inicio: Date, fim: Date): Promise<VendasPorCanal[]> {
    const grupos = await this.db.reserva.groupBy({
      by: ["canal"],
      where: { status: "PAGA", sessao: { inicio: { gte: inicio, lt: fim } } },
      _count: { _all: true },
      _sum: { valorTotal: true },
      orderBy: { canal: "asc" },
    });
    return grupos.map((g) => ({
      canal: g.canal,
      reservas: g._count._all,
      valor: g._sum.valorTotal ? paraNumero(g._sum.valorTotal) : 0,
    }));
  }

  async verificarConexao(): Promise<boolean> {
    await this.db.$queryRaw`SELECT 1`;
    return true;
  }
}
