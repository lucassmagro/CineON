// Cada filme ganha um tom sólido de uma paleta sóbria. Ele aparece no ingresso e na capa
// enquanto o pôster carrega (ou quando não tem). Botões e seleção usam sempre o azul do sistema.
const TONS = [
  '#4E6E8E', // azul ardósia
  '#6F5A8C', // lavanda
  '#4B7F78', // verde-azulado
  '#8C5468', // ameixa
  '#5E7A52', // sálvia
  '#7A6248', // café
  '#55657F', // grafite azulado
  '#8A6A3F', // âmbar escuro
];

function numeroDoTitulo(titulo: string): number {
  let h = 0;
  for (const ch of titulo) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// com o id, filmes cadastrados em sequência nunca repetem o tom (até 8 seguidos)
export function corDoFilme(titulo: string, id?: number): string {
  const n = id ?? numeroDoTitulo(titulo);
  return TONS[n % TONS.length]!;
}

// mesmo tom calculado a partir de um texto qualquer (ex.: o nome no avatar da conta)
export function tomDoTexto(texto: string): string {
  return TONS[numeroDoTitulo(texto) % TONS.length]!;
}
