import { ConflitoError, RecursoNaoEncontradoError } from "../domain/erros.js";
import type { DadosFilme, Filme, Relogio, SessaoDetalhada } from "../domain/modelos.js";
import type { FilmeRepository, SessaoRepository } from "../repositories/contratos.js";

export class FilmeService {
  constructor(
    private readonly filmes: FilmeRepository,
    private readonly sessoes: SessaoRepository,
    private readonly agora: Relogio,
  ) {}

  listar(opcoes: { emCartaz: boolean }): Promise<Filme[]> {
    return opcoes.emCartaz
      ? this.filmes.listar({ somenteAtivos: true, comSessaoAPartirDe: this.agora() })
      : this.filmes.listar({ somenteAtivos: false });
  }

  async buscar(id: number): Promise<Filme> {
    const filme = await this.filmes.buscarPorId(id);
    if (!filme) throw new RecursoNaoEncontradoError("Filme");
    return filme;
  }

  async buscarComSessoes(id: number): Promise<Filme & { sessoes: SessaoDetalhada[] }> {
    const filme = await this.buscar(id);
    const sessoes = await this.sessoes.listar({ filmeId: id, de: this.agora() });
    return { ...filme, sessoes };
  }

  criar(dados: DadosFilme): Promise<Filme> {
    return this.filmes.criar(limpar(dados));
  }

  async atualizar(id: number, dados: Partial<DadosFilme & { ativo: boolean }>): Promise<Filme> {
    const atual = await this.buscar(id);
    // o fim das sessões já criadas foi calculado com a duração antiga
    if (dados.duracaoMin !== undefined && dados.duracaoMin !== atual.duracaoMin) {
      if ((await this.filmes.contarSessoes(id)) > 0) {
        throw new ConflitoError("A duração não pode mudar: o filme já possui sessões");
      }
    }
    return this.filmes.atualizar(id, limpar(dados));
  }

  async remover(id: number): Promise<void> {
    await this.buscar(id);
    if ((await this.filmes.contarSessoes(id)) > 0) {
      throw new ConflitoError("O filme possui sessões e não pode ser excluído. Desative-o.");
    }
    await this.filmes.remover(id);
  }
}

function limpar<T extends Partial<DadosFilme>>(dados: T): T {
  return {
    ...dados,
    ...(dados.titulo !== undefined ? { titulo: dados.titulo.trim() } : {}),
    ...(dados.sinopse !== undefined ? { sinopse: dados.sinopse.trim() } : {}),
    ...(dados.genero !== undefined ? { genero: dados.genero.trim() } : {}),
  };
}
