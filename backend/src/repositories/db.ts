import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

// pode ser o client normal ou o tx de uma transação
export type Db = PrismaClient | Prisma.TransactionClient;

export function paraNumero(valor: Prisma.Decimal | number | string): number {
  if (typeof valor === "number") return valor;
  return Number(valor.toString());
}

export const incluirSessaoDetalhada = {
  filme: { select: { id: true, titulo: true, duracaoMin: true, classificacao: true, genero: true, posterUrl: true } },
  sala: { select: { id: true, nome: true } },
} satisfies Prisma.SessaoInclude;

type SessaoComRelacoes = Prisma.SessaoGetPayload<{ include: typeof incluirSessaoDetalhada }>;

export function sessaoParaDominio(s: SessaoComRelacoes) {
  return {
    id: s.id,
    filmeId: s.filmeId,
    salaId: s.salaId,
    inicio: s.inicio,
    fim: s.fim,
    preco: paraNumero(s.preco),
    filme: s.filme,
    sala: s.sala,
  };
}
