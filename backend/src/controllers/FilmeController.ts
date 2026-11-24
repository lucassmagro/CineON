import type { Request, Response } from "express";
import { sessaoDto } from "../dto/respostas.js";
import type { FilmeService } from "../services/FilmeService.js";
import type { PosterService } from "../services/PosterService.js";
import { AlteracaoFilme, FiltroFilmes, NovoFilme, ParamId } from "../validation/esquemas.js";

export class FilmeController {
  constructor(
    private readonly filmes: FilmeService,
    private readonly posteres: PosterService,
  ) {}

  // ?emCartaz=true traz só os ativos que têm sessão futura
  listar = async (req: Request, res: Response) => {
    const { emCartaz } = FiltroFilmes.parse(req.query);
    res.json(await this.filmes.listar({ emCartaz: emCartaz === "true" }));
  };

  buscar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    const filme = await this.filmes.buscarComSessoes(id);
    res.json({ ...filme, sessoes: filme.sessoes.map(sessaoDto) });
  };

  criar = async (req: Request, res: Response) => {
    res.status(201).json(await this.filmes.criar(NovoFilme.parse(req.body)));
  };

  atualizar = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    res.json(await this.filmes.atualizar(id, AlteracaoFilme.parse(req.body)));
  };

  // o corpo chega cru (bytes da imagem), lido pelo express.raw da rota
  enviarPoster = async (req: Request, res: Response) => {
    res.status(201).json(await this.posteres.enviar(Buffer.isBuffer(req.body) ? req.body : undefined));
  };

  remover = async (req: Request, res: Response) => {
    const { id } = ParamId.parse(req.params);
    await this.filmes.remover(id);
    res.status(204).end();
  };
}
