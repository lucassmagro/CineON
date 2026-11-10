import { randomUUID } from "node:crypto";
import {
  RecursoNaoEncontradoError,
  ReservaExpiradaError,
  ReservaInvalidaError,
} from "../domain/erros.js";
import type { Relogio, ReservaDetalhada, UsuarioAutenticado } from "../domain/modelos.js";
import { gerarCodigoIngresso, multiplicarDinheiro } from "../domain/valores.js";
import type { ReservaRepository, UnidadeDeTrabalho } from "../repositories/contratos.js";
import { garantirDonoOuOperador } from "./ReservaService.js";

// Pagamento simulado (não tem gateway de verdade, como pede o enunciado):
// sempre aprova e gera um id de transação qualquer.
export class PagamentoService {
  constructor(
    private readonly uow: UnidadeDeTrabalho,
    private readonly reservas: ReservaRepository,
    private readonly agora: Relogio,
    private readonly gerarCodigo: () => string = gerarCodigoIngresso,
  ) {}

  async pagar(usuario: UsuarioAutenticado, reservaId: number): Promise<ReservaDetalhada> {
    await this.uow.executar(async (repos) => {
      const agora = this.agora();

      // trava a reserva pra não pagar duas vezes nem brigar com o job de expiração
      const reserva = await repos.reservas.travar(reservaId);
      if (!reserva) throw new RecursoNaoEncontradoError("Reserva");
      garantirDonoOuOperador(usuario, reserva.usuarioId);

      if (reserva.status === "PAGA") throw new ReservaInvalidaError("Esta reserva já foi paga");
      if (reserva.status === "CANCELADA") throw new ReservaInvalidaError("Esta reserva foi cancelada");
      if (reserva.status === "EXPIRADA") throw new ReservaExpiradaError();
      // o job pode ainda não ter rodado, então confere o prazo aqui também
      if (reserva.expiraEm.getTime() <= agora.getTime()) throw new ReservaExpiradaError();

      const sessao = await repos.sessoes.buscarPorId(reserva.sessaoId);
      if (!sessao) throw new RecursoNaoEncontradoError("Sessão");

      const assentos = (await repos.mapa.travarDaReserva(reserva.id)).filter((a) => a.status === "RESERVADO");
      if (assentos.length === 0) throw new ReservaInvalidaError("A reserva não possui assentos reservados");

      // o valor é sempre calculado aqui, nunca vem do app
      const valorTotal = multiplicarDinheiro(sessao.preco, assentos.length);

      await repos.pagamentos.criar({ reservaId: reserva.id, valor: valorTotal, transacao: randomUUID(), pagoEm: agora });
      await repos.reservas.atualizarStatus(reserva.id, "PAGA", valorTotal);
      await repos.mapa.marcarVendidos(reserva.id);

      // um ingresso por assento
      await repos.ingressos.criarVarios(
        assentos.map((a) => ({
          codigo: this.gerarCodigo(),
          reservaId: reserva.id,
          sessaoId: reserva.sessaoId,
          assentoId: a.assentoId,
          valor: sessao.preco,
          emitidoEm: agora,
        })),
      );
    });

    const paga = await this.reservas.buscarDetalhada(reservaId);
    if (!paga) throw new RecursoNaoEncontradoError("Reserva");
    return paga;
  }
}
