import type { ConfigRegras } from "../config.js";
import {
  AcessoNegadoError,
  AssentoIndisponivelError,
  RecursoNaoEncontradoError,
  RegraNegocioError,
  ReservaInvalidaError,
} from "../domain/erros.js";
import type { CanalVenda, Relogio, ReservaDetalhada, UsuarioAutenticado } from "../domain/modelos.js";
import { multiplicarDinheiro, rotuloAssento, somarMinutos } from "../domain/valores.js";
import type { ReservaRepository, UnidadeDeTrabalho } from "../repositories/contratos.js";
import { estaDisponivel } from "./regrasAssento.js";

export type PedidoReserva = { sessaoId: number; assentoIds: number[]; nomeCliente?: string | null };

export class ReservaService {
  constructor(
    private readonly uow: UnidadeDeTrabalho,
    private readonly reservas: ReservaRepository,
    private readonly regras: ConfigRegras,
    private readonly agora: Relogio,
  ) {}

  // Reserva temporária. Tudo numa transação: trava os assentos, confere se estão
  // livres e cria a reserva. Se duas pessoas pedirem o mesmo assento juntas, a
  // segunda fica esperando o lock e, quando continua, já vê o assento reservado.
  async reservar(usuario: UsuarioAutenticado, pedido: PedidoReserva): Promise<ReservaDetalhada> {
    const assentoIds = [...new Set(pedido.assentoIds)];
    if (assentoIds.length === 0) throw new RegraNegocioError("Escolha pelo menos um assento");
    if (assentoIds.length !== pedido.assentoIds.length) throw new RegraNegocioError("Assento repetido no pedido");
    if (assentoIds.length > this.regras.maxAssentosPorReserva) {
      throw new RegraNegocioError(`É possível reservar no máximo ${this.regras.maxAssentosPorReserva} assentos por vez`);
    }

    // se quem reserva é operador, é venda no balcão
    const canal: CanalVenda = usuario.papel === "OPERADOR" ? "BALCAO" : "ONLINE";
    const nomeCliente = canal === "BALCAO" ? pedido.nomeCliente?.trim() || null : null;

    const reservaId = await this.uow.executar(async (repos) => {
      const agora = this.agora();

      const sessao = await repos.sessoes.buscarPorId(pedido.sessaoId);
      if (!sessao) throw new RecursoNaoEncontradoError("Sessão");
      if (sessao.inicio.getTime() <= agora.getTime()) {
        throw new RegraNegocioError("Esta sessão já começou; não é mais possível reservar");
      }

      // se o cliente voltar e escolher outros assentos, a reserva anterior é cancelada
      if (canal === "ONLINE") {
        const anterior = await repos.reservas.travarPendenteDoUsuario(usuario.id, sessao.id);
        if (anterior) {
          await repos.mapa.liberarDasReservas([anterior.id]);
          await repos.reservas.atualizarStatus(anterior.id, "CANCELADA");
        }
      }

      // quem chegar depois fica esperando aqui
      const travados = await repos.mapa.travar(sessao.id, assentoIds);
      if (travados.length !== assentoIds.length) {
        throw new RecursoNaoEncontradoError("Assento desta sessão");
      }

      const indisponiveis = travados.filter((a) => !estaDisponivel(a, agora));
      if (indisponiveis.length > 0) {
        throw new AssentoIndisponivelError(indisponiveis.map(rotuloAssento));
      }

      const reserva = await repos.reservas.criar({
        usuarioId: usuario.id,
        sessaoId: sessao.id,
        canal,
        nomeCliente,
        criadaEm: agora,
        expiraEm: somarMinutos(agora, this.regras.reservaMinutos),
        valorTotal: multiplicarDinheiro(sessao.preco, assentoIds.length),
      });
      await repos.mapa.marcarReservados(sessao.id, assentoIds, reserva.id);
      return reserva.id;
    });

    return this.buscarSemChecagem(reservaId);
  }

  async buscar(usuario: UsuarioAutenticado, id: number): Promise<ReservaDetalhada> {
    const reserva = await this.buscarSemChecagem(id);
    garantirDonoOuOperador(usuario, reserva.usuarioId);
    return reserva;
  }

  async cancelar(usuario: UsuarioAutenticado, id: number): Promise<void> {
    await this.uow.executar(async (repos) => {
      const reserva = await repos.reservas.travar(id);
      if (!reserva) throw new RecursoNaoEncontradoError("Reserva");
      garantirDonoOuOperador(usuario, reserva.usuarioId);
      if (reserva.status !== "PENDENTE") {
        throw new ReservaInvalidaError("Só é possível desistir de uma reserva pendente");
      }
      await repos.mapa.liberarDasReservas([id]);
      await repos.reservas.atualizarStatus(id, "CANCELADA");
    });
  }

  // chamado pelo job: marca as pendentes vencidas como EXPIRADA e libera os assentos
  async expirarVencidas(limite = 200): Promise<number> {
    return this.uow.executar(async (repos) => {
      const ids = await repos.reservas.travarVencidas(this.agora(), limite);
      if (ids.length === 0) return 0;
      await repos.mapa.liberarDasReservas(ids);
      return repos.reservas.marcarStatus(ids, "EXPIRADA");
    });
  }

  private async buscarSemChecagem(id: number): Promise<ReservaDetalhada> {
    const reserva = await this.reservas.buscarDetalhada(id);
    if (!reserva) throw new RecursoNaoEncontradoError("Reserva");
    return reserva;
  }
}

export function garantirDonoOuOperador(usuario: UsuarioAutenticado, donoId: number): void {
  if (usuario.papel !== "OPERADOR" && usuario.id !== donoId) {
    throw new AcessoNegadoError();
  }
}
