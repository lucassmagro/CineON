import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PosterRepository } from "./contratos.js";

// grava o pôster na pasta que a API já serve em /posteres
export class PosterDiscoRepository implements PosterRepository {
  constructor(private readonly pasta: string) {}

  async salvar(nome: string, conteudo: Uint8Array): Promise<void> {
    // "wx" não sobrescreve se por acaso o nome já existir
    await writeFile(join(this.pasta, nome), conteudo, { flag: "wx" });
  }
}
