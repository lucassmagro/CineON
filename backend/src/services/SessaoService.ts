import type { ConfigRegras } from "../config.js";
import {
  ConflitoError,
  RecursoNaoEncontradoError,
  RegraNegocioError,
  SessaoSobrepostaError,
} from "../domain/erros.js";
import type {
  Relogio,
  SessaoDetalhada,
  StatusAssento,
  UsuarioAutenticado,
} from "../domain/modelos.js";
import { intervaloDoDia, somarMinutos } from "../domain/valores.js";
import type {
  FilmeRepository,
  MapaAssentosRepository,
  SalaRepository,
  SessaoRepository,
} from "../repositories/contratos.js";
import { statusEfetivo } from "./regrasAssento.js";

export type AssentoNoMapa = { id: number; numero: number; status: StatusAssento; minhaReserva: boolean };
export type FilaNoMapa = { fila: string; assentos: AssentoNoMapa[] };
export type MapaSessao = {
  sessao: SessaoDetalhada;
  filas: FilaNoMapa[];
  resumo: { livres: number; reservados: number; vendidos: number; capacidade: number };
};

export type DadosSessao = { filmeId: number; salaId: number; inicio: Date; preco: number };

export class SessaoService {
  constructor(
    private readonly sessoes: SessaoRepository,
    private readonly filmes: FilmeRepository,
    private readonly salas: SalaRepository,
    private readonly mapa: MapaAssentosRepository,
    private readonly regras: ConfigRegras,
    private readonly agora: Relogio,
  ) {}

  // sem data, lista as próximas sessões a partir de agora
  listar(filtro: { filmeId?: number; data?: string; incluirPassadas?: boolean }): Promise<SessaoDetalhada[]> {
    const agora = this.agora();
    if (filtro.data) {
      const { de, ate } = intervaloDoDia(filtro.data);
      const inicio = filtro.incluirPassadas || de > agora ? de : agora;
      return this.sessoes.listar({ filmeId: filtro.filmeId, de: inicio, ate });
    }
    return this.sessoes.listar({
      filmeId: filtro.filmeId,
      de: filtro.incluirPassadas ? somarMinutos(agora, -7 * 24 * 60) : agora,
    });
  }

  async buscar(id: number): Promise<SessaoDetalhada> {
    const sessao = await this.sessoes.buscarPorId(id);
    if (!sessao) throw new RecursoNaoEncontradoError("Sessão");
    return sessao;
  }

  async criar(dados: DadosSessao): Promise<SessaoDetalhada> {
    const agora = this.agora();
    const filme = await this.filmes.buscarPorId(dados.filmeId);
    if (!filme) throw new RecursoNaoEncontradoError("Filme");
    if (!filme.ativo) throw new RegraNegocioError("O filme está desativado");

    const sala = await this.salas.buscarPorId(dados.salaId);
    if (!sala) throw new RecursoNaoEncontradoError("Sala");
    if (!sala.ativa) throw new RegraNegocioError("A sala está desativada");
    if (sala.capacidade === 0) throw new RegraNegocioError("A sala não possui assentos");

    if (dados.inicio.getTime() <= agora.getTime()) {
      throw new RegraNegocioError("A sessão deve começar no futuro");
    }
    if (dados.preco < 0) throw new RegraNegocioError("O preço não pode ser negativo");

    // duração do filme + tempo de limpeza da sala
    const fim = somarMinutos(dados.inicio, filme.duracaoMin + this.regras.limpezaSalaMin);

    // o EXCLUDE no banco também barra, mas aqui dá pra devolver uma mensagem melhor
    if (await this.sessoes.existeSobreposicao(dados.salaId, dados.inicio, fim)) {
      throw new SessaoSobrepostaError();
    }

    return this.sessoes.criar({ ...dados, preco: arredondar(dados.preco), fim });
  }

  async atualizarPreco(id: number, preco: number): Promise<SessaoDetalhada> {
    await this.buscar(id);
    if (preco < 0) throw new RegraNegocioError("O preço não pode ser negativo");
    if ((await this.sessoes.contarReservas(id)) > 0) {
      throw new ConflitoError("A sessão já possui reservas ou vendas; o preço não pode mudar");
    }
    return this.sessoes.atualizarPreco(id, arredondar(preco));
  }

  async remover(id: number): Promise<void> {
    await this.buscar(id);
    if ((await this.sessoes.contarReservas(id)) > 0) {
      throw new ConflitoError("A sessão já possui reservas ou vendas e não pode ser excluída");
    }
    await this.sessoes.remover(id);
  }

  async mapaDeAssentos(sessaoId: number, usuario?: UsuarioAutenticado): Promise<MapaSessao> {
    const sessao = await this.buscar(sessaoId);
    const agora = this.agora();
    const assentos = await this.mapa.listar(sessaoId);

    const filas = new Map<string, AssentoNoMapa[]>();
    const resumo = { livres: 0, reservados: 0, vendidos: 0, capacidade: assentos.length };

    for (const a of assentos) {
      const status = statusEfetivo(a, agora);
      if (status === "LIVRE") resumo.livres++;
      else if (status === "RESERVADO") resumo.reservados++;
      else resumo.vendidos++;

      const lista = filas.get(a.fila) ?? [];
      lista.push({
        id: a.assentoId,
        numero: a.numero,
        status,
        minhaReserva: status === "RESERVADO" && usuario !== undefined && a.reservaUsuarioId === usuario.id,
      });
      filas.set(a.fila, lista);
    }

    return {
      sessao,
      filas: [...filas.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fila, lista]) => ({ fila, assentos: lista.sort((x, y) => x.numero - y.numero) })),
      resumo,
    };
  }
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
