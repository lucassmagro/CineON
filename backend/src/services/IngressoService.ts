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
