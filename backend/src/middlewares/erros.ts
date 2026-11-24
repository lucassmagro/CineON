import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { type CategoriaErro, ErroDominio } from "../domain/erros.js";

const STATUS_POR_CATEGORIA: Record<CategoriaErro, number> = {
  NAO_ENCONTRADO: 404,
  NAO_AUTENTICADO: 401,
  PROIBIDO: 403,
  CONFLITO: 409,
  EXPIRADO: 410,
  REGRA_VIOLADA: 422,
};

export const rotaNaoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Rota não encontrada", codigo: "ROTA_NAO_ENCONTRADA" });
};

// O Express 5 já manda pra cá os erros dos handlers async.
// Erro desconhecido vira 500 sem detalhes (não vaza stack trace).
export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof ZodError) {
    res.status(400).json({
      message: "Dados inválidos",
      codigo: "DADOS_INVALIDOS",
      erros: erro.issues.map((i) => ({ campo: i.path.join("."), problema: i.message })),
    });
    return;
  }

  if (erro instanceof ErroDominio) {
    res.status(STATUS_POR_CATEGORIA[erro.categoria]).json({
      message: erro.message,
      codigo: erro.name.replace(/Error$/, ""),
      ...(erro.detalhes !== undefined ? { detalhes: erro.detalhes } : {}),
    });
    return;
  }

  // corpo maior que o limite do express.json/express.raw
  if (typeof erro === "object" && erro !== null && "type" in erro && erro.type === "entity.too.large") {
    res.status(413).json({ message: "O arquivo enviado é grande demais", codigo: "CONTEUDO_GRANDE_DEMAIS" });
    return;
  }

  // corpo com JSON inválido
  if (erro instanceof SyntaxError && "body" in erro) {
    res.status(400).json({ message: "JSON inválido", codigo: "JSON_INVALIDO" });
    return;
  }

  // erros de constraint do banco (só chegam aqui se algo escapar do service)
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2025") {
      res.status(404).json({ message: "Registro não encontrado", codigo: "NAO_ENCONTRADO" });
      return;
    }
    if (erro.code === "P2002") {
      res.status(409).json({ message: "Conflito: o registro já existe", codigo: "VIOLACAO_UNICIDADE" });
      return;
    }
    if (erro.code === "P2003") {
      res.status(409).json({ message: "Registro relacionado inválido ou em uso", codigo: "VIOLACAO_FK" });
      return;
    }
  }
  const mensagem = erro instanceof Error ? erro.message : "";
  if (mensagem.includes("ex_sessoes_sala_sem_sobreposicao")) {
    res.status(409).json({ message: "Já existe uma sessão nesta sala nesse horário", codigo: "SessaoSobreposta" });
    return;
  }

  console.error(erro);
  res.status(500).json({ message: "Erro interno. Tente novamente.", codigo: "ERRO_INTERNO" });
};
