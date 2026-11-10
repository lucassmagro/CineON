import "dotenv/config";

// lê o .env e já quebra na inicialização se faltar alguma variável obrigatória
function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida (veja .env.example)`);
  return valor;
}

function inteiro(nome: string, padrao: number): number {
  const bruto = process.env[nome];
  if (bruto === undefined || bruto.trim() === "") return padrao;
  const valor = Number(bruto.trim());
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`Variável ${nome} deve ser um inteiro >= 0`);
  }
  return valor;
}

export const PORTA = inteiro("PORT", 3000);
export const JWT_SECRET = obrigatoria("JWT_SECRET");
export const JWT_MINUTOS = inteiro("JWT_MINUTOS", 120);

export type ConfigRegras = {
  reservaMinutos: number;
  validacaoAntecedenciaMin: number;
  limpezaSalaMin: number;
  maxAssentosPorReserva: number;
};

export const REGRAS: ConfigRegras = {
  reservaMinutos: inteiro("RESERVA_MINUTOS", 10),
  validacaoAntecedenciaMin: inteiro("VALIDACAO_ANTECEDENCIA_MIN", 60),
  limpezaSalaMin: inteiro("LIMPEZA_SALA_MIN", 15),
  maxAssentosPorReserva: 10,
};

export const CORS_ORIGENS = (process.env.CORS_ORIGENS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o.length > 0);
