import type { Request, Response } from "express";
import type { SalaService } from "../services/SalaService.js";
import { AlteracaoSala, NovaSala, ParamId } from "../validation/esquemas.js";

export class SalaController {
  constructor(private readonly salas: SalaService) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.salas.listar());
  };

  buscar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    res.json(await this.salas.buscar(id));
  };

  criar = async (req: Request, res: Response) => {
    res.status(201).json(await this.salas.criar(NovaSala.parse(req.body)));
  };

  atualizar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    res.json(await this.salas.atualizar(id, AlteracaoSala.parse(req.body)));
  };

  remover = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    await this.salas.remover(id);
    res.status(204).end();
  };
}
