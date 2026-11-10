import type { Request, Response } from "express";
import { sessaoDto } from "../dto/respostas.js";
import { usuarioOpcional } from "../middlewares/autenticacao.js";
import type { SessaoService } from "../services/SessaoService.js";
import { AlteracaoSessao, FiltroSessoes, NovaSessao, ParamId } from "../validation/esquemas.js";

export class SessaoController {
  constructor(private readonly sessoes: SessaoService) {}

  // todas=true inclui as sessões dos últimos dias (tela da gerência)
  listar = async (req: Request, res: Response) => {
    const { filmeId, data, todas } = FiltroSessoes.parse(req.query);
    const lista = await this.sessoes.listar({ filmeId, data, incluirPassadas: todas === "true" });
    res.json(lista.map(sessaoDto));
  };

  buscar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    res.json(sessaoDto(await this.sessoes.buscar(id)));
  };

  // rota pública; se vier token, marca os assentos que são da reserva do usuário
  mapa = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    const mapa = await this.sessoes.mapaDeAssentos(id, usuarioOpcional(res));
    res.json({ ...mapa, sessao: sessaoDto(mapa.sessao) });
  };

  criar = async (req: Request, res: Response) => {
    const sessao = await this.sessoes.criar(NovaSessao.parse(req.body));
    res.status(201).json(sessaoDto(sessao));
  };

  atualizar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    const { preco } = AlteracaoSessao.parse(req.body);
    res.json(sessaoDto(await this.sessoes.atualizarPreco(id, preco)));
  };

  remover = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    await this.sessoes.remover(id);
    res.status(204).end();
  };
}
