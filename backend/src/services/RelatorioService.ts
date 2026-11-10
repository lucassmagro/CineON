import { RegraNegocioError } from "../domain/erros.js";
import type { LinhaOcupacao, VendasPorCanal } from "../domain/modelos.js";
import { somarDinheiro } from "../domain/valores.js";
import type { RelatorioRepository } from "../repositories/contratos.js";

export type Periodo = { inicio: Date; fim: Date };

export type RelatorioOcupacao = {
  periodo: Periodo;
  sessoes: LinhaOcupacao[];
  totais: { sessoes: number; capacidade: number; vendidos: number; taxaOcupacao: number; receita: number };
};

export type RelatorioVendas = {
  periodo: Periodo;
  receitaTotal: number;
  ingressosVendidos: number;
  porCanal: VendasPorCanal[];
  porFilme: { filmeId: number; filme: string; sessoes: number; ingressos: number; receita: number; taxaOcupacao: number }[];
};

const MAX_DIAS = 366;

export class RelatorioService {
  constructor(private readonly relatorios: RelatorioRepository) {}

  async ocupacao(periodo: Periodo, filmeId?: number): Promise<RelatorioOcupacao> {
    validarPeriodo(periodo);
    const sessoes = await this.relatorios.ocupacao(periodo.inicio, periodo.fim, filmeId);
    const capacidade = sessoes.reduce((t, s) => t + s.capacidade, 0);
    const vendidos = sessoes.reduce((t, s) => t + s.vendidos, 0);
    return {
      periodo,
      sessoes,
      totais: {
        sessoes: sessoes.length,
        capacidade,
        vendidos,
        taxaOcupacao: percentual(vendidos, capacidade),
        receita: somarDinheiro(sessoes.map((s) => s.receita)),
      },
    };
  }

  async vendas(periodo: Periodo): Promise<RelatorioVendas> {
    validarPeriodo(periodo);
    const [linhas, porCanal] = await Promise.all([
      this.relatorios.ocupacao(periodo.inicio, periodo.fim),
      this.relatorios.vendasPorCanal(periodo.inicio, periodo.fim),
    ]);

    const filmes = new Map<number, { filme: string; sessoes: number; ingressos: number; receitas: number[]; capacidade: number }>();
    for (const l of linhas) {
      const f = filmes.get(l.filmeId) ?? { filme: l.filme, sessoes: 0, ingressos: 0, receitas: [], capacidade: 0 };
      f.sessoes++;
      f.ingressos += l.vendidos;
      f.receitas.push(l.receita);
      f.capacidade += l.capacidade;
      filmes.set(l.filmeId, f);
    }

    const porFilme = [...filmes.entries()]
      .map(([filmeId, f]) => ({
        filmeId,
        filme: f.filme,
        sessoes: f.sessoes,
        ingressos: f.ingressos,
        receita: somarDinheiro(f.receitas),
        taxaOcupacao: percentual(f.ingressos, f.capacidade),
      }))
      .sort((a, b) => b.receita - a.receita);

    return {
      periodo,
      receitaTotal: somarDinheiro(linhas.map((l) => l.receita)),
      ingressosVendidos: linhas.reduce((t, l) => t + l.vendidos, 0),
      porCanal,
      porFilme,
    };
  }
}

function validarPeriodo({ inicio, fim }: Periodo): void {
  if (fim.getTime() <= inicio.getTime()) throw new RegraNegocioError("O fim do período deve ser depois do início");
  if (fim.getTime() - inicio.getTime() > MAX_DIAS * 24 * 60 * 60_000) {
    throw new RegraNegocioError(`O período pode ter no máximo ${MAX_DIAS} dias`);
  }
}

function percentual(parte: number, todo: number): number {
  return todo === 0 ? 0 : Math.round((parte * 10_000) / todo) / 100;
}
