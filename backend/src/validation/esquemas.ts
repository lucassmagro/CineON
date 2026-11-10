import { z } from "zod";

// Só formato dos dados. As regras de negócio ficam nos services.

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);

export const Id = z.coerce.number().int().positive();
export const ParamId = z.object({ id: Id });

export const Cadastro = z.object({
  nome: texto(2, 100),
  email: z.email().max(150),
  senha: z.string().min(6).max(72), // bcrypt ignora o que passa de 72 bytes
});

export const Login = z.object({
  email: z.string().trim().min(1),
  senha: z.string().min(1),
});

// caminho servido pela própria API (/posteres/arquivo.jpg) ou um endereço http(s); vazio tira o pôster
const Poster = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().max(300).regex(/^(\/|https?:\/\/)\S+$/, "Use um caminho /posteres/... ou um endereço http(s)").nullable(),
);

const CLASSIFICACOES = ["L", "10", "12", "14", "16", "18"] as const;

const CamposFilme = z.object({
  titulo: texto(1, 150),
  sinopse: z.string().trim().max(2000),
  duracaoMin: z.number().int().min(1).max(600),
  classificacao: z.enum(CLASSIFICACOES),
  genero: texto(1, 50),
  posterUrl: Poster,
});

export const NovoFilme = CamposFilme.extend({
  sinopse: CamposFilme.shape.sinopse.default(""),
  posterUrl: Poster.optional(),
});

// sem default aqui: no zod 4 o partial ainda aplica o default e apagaria a sinopse num PATCH
export const AlteracaoFilme = CamposFilme.partial()
  .extend({ ativo: z.boolean().optional() })
  .strict();

export const NovaSala = z.object({
  nome: texto(1, 50),
  filas: z.number().int(),
  assentosPorFila: z.number().int(),
});

export const AlteracaoSala = z.object({ nome: texto(1, 50).optional(), ativa: z.boolean().optional() }).strict();

// ex.: 2026-11-24T19:30:00-03:00
const DataHora = z.iso.datetime({ offset: true }).transform((s) => new Date(s));
const Data = z.iso.date();

export const NovaSessao = z.object({
  filmeId: Id,
  salaId: Id,
  inicio: DataHora,
  preco: z.number().min(0).max(1000),
});

export const AlteracaoSessao = z.object({ preco: z.number().min(0).max(1000) }).strict();

export const FiltroSessoes = z.object({
  filmeId: Id.optional(),
  data: Data.optional(),
  todas: z.enum(["true", "false"]).optional(),
});

export const FiltroFilmes = z.object({ emCartaz: z.enum(["true", "false"]).optional() });

export const NovaReserva = z.object({
  sessaoId: Id,
  assentoIds: z.array(Id).min(1).max(10),
  nomeCliente: texto(1, 100).optional(),
});

export const Validacao = z.object({ codigo: texto(4, 20) });

export const ParamCodigo = z.object({ codigo: texto(4, 20) });

export const Periodo = z
  .object({ inicio: DataHora, fim: DataHora, filmeId: Id.optional() })
  .refine((p) => p.fim > p.inicio, { message: "fim deve ser depois de inicio", path: ["fim"] });
