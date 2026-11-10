import type { Prisma } from "../../generated/prisma/client.js";
import type { DadosFilme, Filme } from "../domain/modelos.js";
import type { FilmeRepository } from "./contratos.js";
import type { Db } from "./db.js";

const campos = {
  id: true,
  titulo: true,
  sinopse: true,
  duracaoMin: true,
  classificacao: true,
  genero: true,
  ativo: true,
} satisfies Prisma.FilmeSelect;

export class FilmePrismaRepository implements FilmeRepository {
  constructor(private readonly db: Db) {}

  listar(filtro: { somenteAtivos: boolean; comSessaoAPartirDe?: Date }): Promise<Filme[]> {
    return this.db.filme.findMany({
      where: {
        ...(filtro.somenteAtivos ? { ativo: true } : {}),
        // em cartaz = tem alguma sessão daqui pra frente
        ...(filtro.comSessaoAPartirDe ? { sessoes: { some: { inicio: { gte: filtro.comSessaoAPartirDe } } } } : {}),
      },
      select: campos,
      orderBy: { titulo: "asc" },
    });
  }

  buscarPorId(id: number): Promise<Filme | null> {
    return this.db.filme.findUnique({ where: { id }, select: campos });
  }

  criar(dados: DadosFilme): Promise<Filme> {
    return this.db.filme.create({ data: dados, select: campos });
  }

  atualizar(id: number, dados: Partial<DadosFilme & { ativo: boolean }>): Promise<Filme> {
    return this.db.filme.update({ where: { id }, data: dados, select: campos });
  }

  async remover(id: number): Promise<void> {
    await this.db.filme.delete({ where: { id } });
  }

  contarSessoes(id: number): Promise<number> {
    return this.db.sessao.count({ where: { filmeId: id } });
  }
}
