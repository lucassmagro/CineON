import type { Request, Response } from "express";
import { ingressoDto } from "../dto/respostas.js";
import { usuarioDaRequisicao } from "../middlewares/autenticacao.js";
import type { IngressoService } from "../services/IngressoService.js";
import { CancelamentoIngressos, ParamCodigo, Validacao } from "../validation/esquemas.js";

export class IngressoController {
  constructor(private readonly ingressos: IngressoService) {}

  meus = async (_req: Request, res: Response) => {
    const lista = await this.ingressos.meus(usuarioDaRequisicao(res));
    res.json(lista.map(ingressoDto));
  };

  buscar = async (req: Request, res: Response) => {
    const { codigo } = ParamCodigo.parse(req.params);
    res.json(ingressoDto(await this.ingressos.buscarPorCodigo(usuarioDaRequisicao(res), codigo)));
  };

  cancelar = async (req: Request, res: Response) => {
    const { codigos } = CancelamentoIngressos.parse(req.body);
    const lista = await this.ingressos.cancelar(usuarioDaRequisicao(res), codigos);
    res.json(lista.map(ingressoDto));
  };

  validar = async (req: Request, res: Response) => {
    const { codigo } = Validacao.parse(req.body);
    res.json(ingressoDto(await this.ingressos.validar(usuarioDaRequisicao(res), codigo)));
  };
}
