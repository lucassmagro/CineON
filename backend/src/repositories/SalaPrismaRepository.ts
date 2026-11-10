import type { Sala, SalaComAssentos, SalaResumo } from "../domain/modelos.js";
import type { SalaRepository } from "./contratos.js";
import type { Db } from "./db.js";

export class SalaPrismaRepository implements SalaRepository {
  constructor(private readonly db: Db) {}

  async listar(): Promise<SalaResumo[]> {
    const salas = await this.db.sala.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { assentos: true, sessoes: true } },
        assentos: { distinct: ["fila"], select: { fila: true } },
      },
    });
    return salas.map((s) => ({
      id: s.id,
      nome: s.nome,
      ativa: s.ativa,
      capacidade: s._count.assentos,
      filas: s.assentos.length,
      sessoes: s._count.sessoes,
    }));
  }

  async buscarPorId(id: number): Promise<SalaComAssentos | null> {
    const s = await this.db.sala.findUnique({
      where: { id },
      include: {
        _count: { select: { sessoes: true } },
        assentos: { select: { id: true, fila: true, numero: true }, orderBy: [{ fila: "asc" }, { numero: "asc" }] },
      },
    });
    if (!s) return null;
    return {
      id: s.id,
      nome: s.nome,
      ativa: s.ativa,
      capacidade: s.assentos.length,
      filas: new Set(s.assentos.map((a) => a.fila)).size,
      sessoes: s._count.sessoes,
      assentos: s.assentos,
    };
  }

  buscarPorNome(nome: string): Promise<Sala | null> {
    return this.db.sala.findFirst({
      where: { nome: { equals: nome, mode: "insensitive" } },
      select: { id: true, nome: true, ativa: true },
    });
  }

  criar(nome: string): Promise<Sala> {
    return this.db.sala.create({ data: { nome }, select: { id: true, nome: true, ativa: true } });
  }

  async gerarAssentos(salaId: number, filas: number, assentosPorFila: number): Promise<void> {
    await this.db.$executeRaw`CALL sp_gerar_assentos_sala(${salaId}::int, ${filas}::int, ${assentosPorFila}::int)`;
  }

  atualizar(id: number, dados: { nome?: string; ativa?: boolean }): Promise<Sala> {
    return this.db.sala.update({ where: { id }, data: dados, select: { id: true, nome: true, ativa: true } });
  }

  async remover(id: number): Promise<void> {
    await this.db.sala.delete({ where: { id } }); // assentos vão junto (cascade)
  }
}
