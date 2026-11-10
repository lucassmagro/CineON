// Datas sempre no horário de Brasília (UTC-3). Feito na mão porque o Intl
// não se comporta igual em todo celular.
const OFFSET_MS = -3 * 60 * 60_000;
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

// depois disso usar só os getUTC*
function local(data: Date | string): Date {
  return new Date(new Date(data).getTime() + OFFSET_MS);
}

export function dinheiro(valor: number): string {
  const [inteiro, centavos] = valor.toFixed(2).split('.');
  return `R$\u00A0${inteiro!.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centavos}`;
}

export function hora(data: Date | string): string {
  const d = local(data);
  return `${doisDigitos(d.getUTCHours())}:${doisDigitos(d.getUTCMinutes())}`;
}

// ex.: ter, 24 nov
export function dia(data: Date | string): string {
  const d = local(data);
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

export function chaveDia(data: Date | string): string {
  return local(data).toISOString().slice(0, 10);
}

export function diaAmigavel(data: Date | string): string {
  const chave = chaveDia(data);
  if (chave === chaveDia(new Date())) return 'Hoje';
  if (chave === chaveDia(new Date(Date.now() + 86_400_000))) return 'Amanhã';
  return dia(data);
}

export function dataHora(data: Date | string): string {
  return `${diaAmigavel(data)} às ${hora(data)}`;
}

// 112 vira "1 h 52 min"
export function duracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// partes da data pra montar as pílulas de dia (semana em cima, número embaixo)
export function partesDoDia(chave: string): { semana: string; numero: string; mes: string; hoje: boolean } {
  const d = local(`${chave}T12:00:00-03:00`);
  return {
    semana: chave === chaveDia(new Date()) ? 'Hoje' : DIAS[d.getUTCDay()]!,
    numero: String(d.getUTCDate()),
    mes: MESES[d.getUTCMonth()]!,
    hoje: chave === chaveDia(new Date()),
  };
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

export function proximosDias(n: number): { valor: string; rotulo: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() + i * 86_400_000);
    return { valor: chaveDia(d), rotulo: diaAmigavel(d) };
  });
}

export function isoLocal(diaChave: string, hhmm: string): string {
  return `${diaChave}T${hhmm}:00-03:00`;
}

export function agruparPorDia<T>(itens: T[], dataDe: (item: T) => string): { dia: string; itens: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    const chave = chaveDia(dataDe(item));
    grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
  }
  return [...grupos.entries()].map(([chave, lista]) => ({ dia: diaAmigavel(`${chave}T12:00:00-03:00`), itens: lista }));
}

export function minutosESegundos(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${doisDigitos(Math.floor(total / 60))}:${doisDigitos(total % 60)}`;
}
