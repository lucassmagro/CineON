import type { Request, Response } from "express";
import { usuarioDto } from "../dto/respostas.js";
import { usuarioDaRequisicao } from "../middlewares/autenticacao.js";
import type { AuthService } from "../services/AuthService.js";
import { Cadastro, Login } from "../validation/esquemas.js";

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  cadastrar = async (req: Request, res: Response) => {
    const usuario = await this.auth.cadastrarCliente(Cadastro.parse(req.body));
    res.status(201).json(usuarioDto(usuario));
  };

  login = async (req: Request, res: Response) => {
    const { email, senha } = Login.parse(req.body);
    const { usuario, accessToken } = await this.auth.login(email, senha);
    res.json({ usuario: usuarioDto(usuario), accessToken });
  };

  eu = async (_req: Request, res: Response) => {
    const usuario = await this.auth.buscarUsuario(usuarioDaRequisicao(res).id);
    res.json(usuarioDto(usuario));
  };

  criarOperador = async (req: Request, res: Response) => {
    const usuario = await this.auth.criarOperador(Cadastro.parse(req.body));
    res.status(201).json(usuarioDto(usuario));
  };
}
