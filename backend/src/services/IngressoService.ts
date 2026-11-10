import type { ConfigRegras } from "../config.js";
import {
  ConflitoError,
  IngressoJaUtilizadoError,
  RecursoNaoEncontradoError,
  RegraNegocioError,
} from "../domain/erros.js";
import type { IngressoDetalhado, Relogio, UsuarioAutenticado } from "../domain/modelos.js";
import { normalizarCodigo, somarMinutos } from "../domain/valores.js";
import type { IngressoRepository, UnidadeDeTrabalho } from "../repositories/contratos.js";
import { garantirDonoOuOperador } from "./ReservaService.js";

export class IngressoService {
  constructor(
    private readonly uow: UnidadeDeTrabalho,
    private readonly ingressos: IngressoRepository,
    private readonly regras: ConfigRegras,
    private readonly agora: Relogio,
  ) {}

  meus(usuario: UsuarioAutenticado): Promise<IngressoDetalhado[]> {
    return this.ingressos.listarDoUsuario(usuario.id);
  }

  async buscarPorCodigo(usuario: UsuarioAutenticado, codigo: string): Promise<IngressoDetalhado> {
    const ingresso = await this.ingressos.buscarPorCodigo(normalizarCodigo(codigo));
    if (!ingresso) throw new RecursoNaoEncontradoError("Ingresso");
    garantirDonoOuOperador(usuario, ingresso.donoId);
    return ingresso;
  }

  // Cancela um ou mais ingressos da mesma compra. Ou cancela todos, ou nenhum.
  // Ordem dos locks: ingressos (por id) e depois assentos (por assento_id), sempre igual.
  async cancelar(usuario: UsuarioAutenticado, codigosDigitados: string[]): Promise<IngressoDetalhado[]> {
    const codigos = [...new Set(codigosDigitados.map(normalizarCodigo))];
    const ids = await this.uow.executar(async (repos) => {
      const agora = this.agora();
      const lista = await repos.ingressos.travarPorCodigos(codigos);
      if (lista.length !== codigos.length) throw new RecursoNaoEncontradoError("Ingresso");

      for (const ingresso of lista) {
        garantirDonoOuOperador(usuario, ingresso.donoId);
        if (ingresso.status === "UTILIZADO") throw new ConflitoError(`O ingresso ${ingresso.codigo} já foi usado na entrada`);
        if (ingresso.status === "CANCELADO") throw new ConflitoError(`O ingresso ${ingresso.codigo} já foi cancelado`);
      }

      const sessaoId = lista[0]!.sessaoId;
      if (lista.some((i) => i.sessaoId !== sessaoId)) throw new RegraNegocioError("Cancele os ingressos de uma sessão por vez");

      const limite = somarMinutos(lista[0]!.sessao.inicio, -this.regras.cancelamentoAntecedenciaMin);
      if (agora.getTime() > limite.getTime()) {
        throw new RegraNegocioError(
          `O cancelamento vai até ${this.regras.cancelamentoAntecedenciaMin} min antes do início da sessão`,
          { limite, inicio: lista[0]!.sessao.inicio },
        );
      }

      const assentoIds = lista.map((i) => i.assentoId);
      await repos.mapa.travar(sessaoId, assentoIds);
      await repos.mapa.liberarVendidos(sessaoId, assentoIds);
      await repos.ingressos.marcarCancelados(lista.map((i) => i.id));

      // devolve o valor de cada ingresso na reserva de onde ele veio
      const porReserva = new Map<number, number>();
      for (const i of lista) porReserva.set(i.reservaId, (porReserva.get(i.reservaId) ?? 0) + i.valor);
      for (const [reservaId, valor] of porReserva) await repos.reservas.descontarValor(reservaId, valor);

      return lista.map((i) => i.codigo);
    });

    const cancelados: IngressoDetalhado[] = [];
    for (const codigo of ids) {
      const i = await this.ingressos.buscarPorCodigo(codigo);
      if (i) cancelados.push(i);
    }
    return cancelados;
  }

  // validação na entrada da sala
  async validar(operador: UsuarioAutenticado, codigoDigitado: string): Promise<IngressoDetalhado> {
    const codigo = normalizarCodigo(codigoDigitado);
    await this.uow.executar(async (repos) => {
      const agora = this.agora();
      const ingresso = await repos.ingressos.travarPorCodigo(codigo);
      if (!ingresso) throw new RecursoNaoEncontradoError("Ingresso");

      if (ingresso.status === "UTILIZADO") throw new IngressoJaUtilizadoError(ingresso.utilizadoEm ?? agora);
      if (ingresso.status === "CANCELADO") throw new ConflitoError("Ingresso cancelado");

      // libera a entrada um pouco antes do início e até o fim da sessão
      const liberadoEm = somarMinutos(ingresso.sessao.inicio, -this.regras.validacaoAntecedenciaMin);
      if (agora.getTime() < liberadoEm.getTime()) {
        throw new RegraNegocioError(
          `Ingresso para outra sessão: a entrada é liberada ${this.regras.validacaoAntecedenciaMin} min antes do início`,
          { liberadoEm, inicio: ingresso.sessao.inicio },
        );
      }
      if (agora.getTime() > ingresso.sessao.fim.getTime()) {
        throw new RegraNegocioError("Esta sessão já terminou", { fim: ingresso.sessao.fim });
      }

      await repos.ingressos.marcarUtilizado(ingresso.id, agora, operador.id);
    });

    const validado = await this.ingressos.buscarPorCodigo(codigo);
    if (!validado) throw new RecursoNaoEncontradoError("Ingresso");
    return validado;
  }
}
