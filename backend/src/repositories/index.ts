import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Repositorios, UnidadeDeTrabalho } from "./contratos.js";
import type { Db } from "./db.js";
import { FilmePrismaRepository } from "./FilmePrismaRepository.js";
import { IngressoPrismaRepository } from "./IngressoPrismaRepository.js";
import { MapaAssentosPrismaRepository } from "./MapaAssentosPrismaRepository.js";
import { PagamentoPrismaRepository } from "./PagamentoPrismaRepository.js";
import { RelatorioPrismaRepository } from "./RelatorioPrismaRepository.js";
import { ReservaPrismaRepository } from "./ReservaPrismaRepository.js";
import { SalaPrismaRepository } from "./SalaPrismaRepository.js";
import { SessaoPrismaRepository } from "./SessaoPrismaRepository.js";
import { UsuarioPrismaRepository } from "./UsuarioPrismaRepository.js";

export function criarRepositorios(db: Db): Repositorios {
  return {
    usuarios: new UsuarioPrismaRepository(db),
    filmes: new FilmePrismaRepository(db),
    salas: new SalaPrismaRepository(db),
    sessoes: new SessaoPrismaRepository(db),
    mapa: new MapaAssentosPrismaRepository(db),
    reservas: new ReservaPrismaRepository(db),
    pagamentos: new PagamentoPrismaRepository(db),
    ingressos: new IngressoPrismaRepository(db),
    relatorios: new RelatorioPrismaRepository(db),
  };
}

// Transação interativa do Prisma. Usamos READ COMMITTED (padrão do Postgres)
// e controlamos a concorrência com FOR UPDATE nos repositories.
export class PrismaUnidadeDeTrabalho implements UnidadeDeTrabalho {
  constructor(private readonly prisma: PrismaClient) {}

  executar<T>(trabalho: (repos: Repositorios) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => trabalho(criarRepositorios(tx)), {
      isolationLevel: "ReadCommitted",
      maxWait: 10_000,
      timeout: 15_000, // inclui o tempo esperando lock
    });
  }
}

export type { Repositorios, UnidadeDeTrabalho } from "./contratos.js";
