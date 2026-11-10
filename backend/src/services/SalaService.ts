import { ConflitoError, RecursoNaoEncontradoError, RegraNegocioError } from "../domain/erros.js";
import type { Sala, SalaComAssentos, SalaResumo } from "../domain/modelos.js";
import type { SalaRepository, UnidadeDeTrabalho } from "../repositories/contratos.js";

export const LIMITES_SALA = { maxFilas: 26, maxAssentosPorFila: 30 } as const;

export class SalaService {
  constructor(
    private readonly salas: SalaRepository,
    private readonly uow: UnidadeDeTrabalho,
  ) {}

  listar(): Promise<SalaResumo[]> {
    return this.salas.listar();
  }

  async buscar(id: number): Promise<SalaComAssentos> {
    const sala = await this.salas.buscarPorId(id);
    if (!sala) throw new RecursoNaoEncontradoError("Sala");
    return sala;
  }

  // sala e assentos na mesma transação, pra não sobrar sala sem assento se a procedure falhar
  async criar(dados: { nome: string; filas: number; assentosPorFila: number }): Promise<SalaComAssentos> {
    const nome = dados.nome.trim();
    if (dados.filas < 1 || dados.filas > LIMITES_SALA.maxFilas) {
      throw new RegraNegocioError(`A sala deve ter de 1 a ${LIMITES_SALA.maxFilas} filas`);
    }
    if (dados.assentosPorFila < 1 || dados.assentosPorFila > LIMITES_SALA.maxAssentosPorFila) {
      throw new RegraNegocioError(`Cada fila deve ter de 1 a ${LIMITES_SALA.maxAssentosPorFila} assentos`);
    }
    await this.garantirNomeLivre(nome);

    const salaId = await this.uow.executar(async (repos) => {
      const sala = await repos.salas.criar(nome);
      await repos.salas.gerarAssentos(sala.id, dados.filas, dados.assentosPorFila);
      return sala.id;
    });
    return this.buscar(salaId);
  }

  async atualizar(id: number, dados: { nome?: string; ativa?: boolean }): Promise<Sala> {
    const sala = await this.buscar(id);
    const nome = dados.nome?.trim();
    if (nome !== undefined && nome.toLowerCase() !== sala.nome.toLowerCase()) {
      await this.garantirNomeLivre(nome);
    }
    return this.salas.atualizar(id, { ...(nome !== undefined ? { nome } : {}), ...(dados.ativa !== undefined ? { ativa: dados.ativa } : {}) });
  }

  async remover(id: number): Promise<void> {
    const sala = await this.buscar(id);
    if (sala.sessoes > 0) {
      throw new ConflitoError("A sala possui sessões e não pode ser excluída. Desative-a.");
    }
    await this.salas.remover(id);
  }

  private async garantirNomeLivre(nome: string): Promise<void> {
    if (await this.salas.buscarPorNome(nome)) {
      throw new ConflitoError(`Já existe uma sala chamada "${nome}"`);
    }
  }
}
