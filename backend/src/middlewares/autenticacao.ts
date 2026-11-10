import type { RequestHandler, Response } from "express";
import { AcessoNegadoError } from "../domain/erros.js";
import type { UsuarioAutenticado } from "../domain/modelos.js";
import type { AuthService } from "../services/AuthService.js";

export function usuarioDaRequisicao(res: Response): UsuarioAutenticado {
  return res.locals.usuario as UsuarioAutenticado;
}

export function usuarioOpcional(res: Response): UsuarioAutenticado | undefined {
  return res.locals.usuario as UsuarioAutenticado | undefined;
}

function lerToken(cabecalho: string | undefined): string | null {
  const [tipo, token] = (cabecalho ?? "").split(" ");
  return tipo === "Bearer" && token ? token : null;
}

export function criarMiddlewaresAuth(auth: AuthService) {
  const autenticar: RequestHandler = (req, res, next) => {
    const token = lerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ message: "Faça login para continuar", codigo: "TOKEN_AUSENTE" });
      return;
    }
    try {
      res.locals.usuario = auth.verificarToken(token);
      next();
    } catch {
      res.status(401).json({ message: "Sessão expirada. Faça login novamente.", codigo: "TOKEN_INVALIDO" });
    }
  };

  // para rotas públicas que mudam um pouco quando o usuário está logado
  const autenticarOpcional: RequestHandler = (req, res, next) => {
    const token = lerToken(req.headers.authorization);
    if (token) {
      try {
        res.locals.usuario = auth.verificarToken(token);
      } catch {
        // segue como visitante
      }
    }
    next();
  };

  // usar depois do autenticar
  const exigirOperador: RequestHandler = (_req, res, next) => {
    if (usuarioDaRequisicao(res).papel !== "OPERADOR") {
      next(new AcessoNegadoError("Área restrita a operadores"));
      return;
    }
    next();
  };

  return { autenticar, autenticarOpcional, exigirOperador };
}

export type MiddlewaresAuth = ReturnType<typeof criarMiddlewaresAuth>;
