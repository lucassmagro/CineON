import type { Papel, Usuario } from "../domain/modelos.js";
import type { UsuarioRepository } from "./contratos.js";
import type { Db } from "./db.js";

export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(private readonly db: Db) {}

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.db.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.db.usuario.findUnique({ where: { id } });
  }

  criar(dados: { nome: string; email: string; senhaHash: string; papel: Papel }): Promise<Usuario> {
    return this.db.usuario.create({ data: dados });
  }
}
