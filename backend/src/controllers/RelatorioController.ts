import type { Request, Response } from "express";
import type { RelatorioService } from "../services/RelatorioService.js";
import { Periodo } from "../validation/esquemas.js";

export class RelatorioController {
  constructor(private readonly relatorios: RelatorioService) {}

  // ?inicio=...&fim=...&filmeId= (datas em ISO)
  ocupacao = async (req: Request, res: Response) => {
    const { inicio, fim, filmeId } = Periodo.parse(req.query);
    res.json(await this.relatorios.ocupacao({ inicio, fim }, filmeId));
  };

  vendas = async (req: Request, res: Response) => {
    const { inicio, fim } = Periodo.parse(req.query);
    res.json(await this.relatorios.vendas({ inicio, fim }));
  };
}
