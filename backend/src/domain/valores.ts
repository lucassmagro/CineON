import { randomBytes } from "node:crypto";

// sem 0/O e 1/I/L pra não confundir na hora de digitar
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const TAMANHO_CODIGO = 10;

// ex.: K7QX3M9PZA. A unicidade de fato quem garante é o UNIQUE no banco.
export function gerarCodigoIngresso(): string {
  const bytes = randomBytes(TAMANHO_CODIGO);
  let codigo = "";
  for (const b of bytes) codigo += ALFABETO[b % ALFABETO.length];
  return codigo;
}

export function normalizarCodigo(codigo: string): string {
  return codigo.replace(/[\s-]/g, "").toUpperCase();
}

// conta em centavos pra não ter erro de ponto flutuante
export function multiplicarDinheiro(valor: number, quantidade: number): number {
  return (Math.round(valor * 100) * quantidade) / 100;
}

export function somarDinheiro(valores: number[]): number {
  return valores.reduce((total, v) => total + Math.round(v * 100), 0) / 100;
}

export function somarMinutos(data: Date, minutos: number): Date {
  return new Date(data.getTime() + minutos * 60_000);
}

export function rotuloAssento(a: { fila: string; numero: number }): string {
  return `${a.fila}${a.numero}`;
}

// Chapecó, sem horário de verão
export const FUSO_CINEMA = "-03:00";

export function intervaloDoDia(data: string): { de: Date; ate: Date } {
  const de = new Date(`${data}T00:00:00${FUSO_CINEMA}`);
  return { de, ate: new Date(de.getTime() + 24 * 60 * 60_000) };
}
