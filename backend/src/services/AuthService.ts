import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  CredenciaisInvalidasError,
  EmailJaCadastradoError,
  RecursoNaoEncontradoError,
} from "../domain/erros.js";
import type { Papel, Usuario, UsuarioAutenticado } from "../domain/modelos.js";
import type { UsuarioRepository } from "../repositories/contratos.js";

export type DadosCadastro = { nome: string; email: string; senha: string };

export type ConfigAuth = { jwtSecret: string; jwtMinutos: number };

const PAPEIS: readonly Papel[] = ["CLIENTE", "OPERADOR"];

export class AuthService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly config: ConfigAuth,
  ) {}

  // o cadastro aberto só cria cliente
  cadastrarCliente(dados: DadosCadastro): Promise<Usuario> {
    return this.criar(dados, "CLIENTE");
  }

  criarOperador(dados: DadosCadastro): Promise<Usuario> {
    return this.criar(dados, "OPERADOR");
  }

  async login(email: string, senha: string): Promise<{ usuario: Usuario; accessToken: string }> {
    const usuario = await this.usuarios.buscarPorEmail(normalizarEmail(email));
    // mesma mensagem nos dois casos pra não revelar se o e-mail existe
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      throw new CredenciaisInvalidasError();
    }
    const accessToken = jwt.sign({ sub: String(usuario.id), papel: usuario.papel }, this.config.jwtSecret, {
      expiresIn: this.config.jwtMinutos * 60,
    });
    return { usuario, accessToken };
  }

  verificarToken(token: string): UsuarioAutenticado {
    const payload = jwt.verify(token, this.config.jwtSecret);
    if (typeof payload === "string" || payload.sub === undefined) throw new CredenciaisInvalidasError();
    const papel = payload["papel"] as Papel;
    if (!PAPEIS.includes(papel)) throw new CredenciaisInvalidasError();
    return { id: Number(payload.sub), papel };
  }

  async buscarUsuario(id: number): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new RecursoNaoEncontradoError("Usuário");
    return usuario;
  }

  private async criar(dados: DadosCadastro, papel: Papel): Promise<Usuario> {
    const email = normalizarEmail(dados.email);
    if (await this.usuarios.buscarPorEmail(email)) throw new EmailJaCadastradoError();
    const senhaHash = await bcrypt.hash(dados.senha, 10);
    return this.usuarios.criar({ nome: dados.nome.trim(), email, senhaHash, papel });
  }
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
