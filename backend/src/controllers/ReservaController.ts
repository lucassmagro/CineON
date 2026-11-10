import type { Request, Response } from "express";
import { reservaDto } from "../dto/respostas.js";
import { usuarioDaRequisicao } from "../middlewares/autenticacao.js";
import type { PagamentoService } from "../services/PagamentoService.js";
import type { ReservaService } from "../services/ReservaService.js";
import { NovaReserva, ParamId } from "../validation/esquemas.js";

export class ReservaController {
  constructor(
    private readonly reservas: ReservaService,
    private readonly pagamentos: PagamentoService,
  ) {}

  criar = async (req: Request, res: Response) => {
    const reserva = await this.reservas.reservar(usuarioDaRequisicao(res), NovaReserva.parse(req.body));
    res.status(201).json(reservaDto(reserva));
  };

  buscar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    res.json(reservaDto(await this.reservas.buscar(usuarioDaRequisicao(res), id)));
  };

  cancelar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    await this.reservas.cancelar(usuarioDaRequisicao(res), id);
    res.status(204).end();
  };

  // pagamento simulado, não recebe corpo
  pagar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    const reserva = await this.pagamentos.pagar(usuarioDaRequisicao(res), id);
    res.status(201).json(reservaDto(reserva));
  };
}
