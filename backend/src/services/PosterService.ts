import { randomBytes } from "node:crypto";
import { RegraNegocioError } from "../domain/erros.js";
import type { PosterRepository } from "../repositories/contratos.js";

export const TAMANHO_MAXIMO_POSTER = 5 * 1024 * 1024;

type Extensao = "jpg" | "png" | "webp";

// olha os primeiros bytes em vez de confiar no Content-Type que o navegador mandou
export function tipoDaImagem(b: Uint8Array): Extensao | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "png";
  const texto = (inicio: number, fim: number) => String.fromCharCode(...b.slice(inicio, fim));
  if (b.length >= 12 && texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP") return "webp";
  return null;
}

export class PosterService {
  constructor(
    private readonly posteres: PosterRepository,
    private readonly gerarNome: () => string = () => `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
  ) {}

  async enviar(conteudo: Uint8Array | undefined): Promise<{ posterUrl: string }> {
    if (!conteudo || conteudo.length === 0) {
      throw new RegraNegocioError("Escolha uma imagem JPG, PNG ou WebP");
    }
    if (conteudo.length > TAMANHO_MAXIMO_POSTER) {
      throw new RegraNegocioError("A imagem passa de 5 MB. Escolha uma menor.");
    }
    const extensao = tipoDaImagem(conteudo);
    if (!extensao) throw new RegraNegocioError("O arquivo não é uma imagem JPG, PNG ou WebP");

    // o nome é gerado aqui, então ninguém escolhe caminho de arquivo pelo upload
    const nome = `upload-${this.gerarNome()}.${extensao}`;
    await this.posteres.salvar(nome, conteudo);
    return { posterUrl: `/posteres/${nome}` };
  }
}
