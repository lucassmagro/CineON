import type { PagamentoRepository } from "./contratos.js";
import type { Db } from "./db.js";

export class PagamentoPrismaRepository implements PagamentoRepository {
  constructor(private readonly db: Db) {}

  async criar(dados: { reservaId: number; valor: number; transacao: string; pagoEm: Date }): Promise<void> {
    await this.db.pagamento.create({ data: dados });
  }
}
