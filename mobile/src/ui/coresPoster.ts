// Paleta de cada filme tirada do pôster: um tom escuro pro fundo da página, um médio (usado
// no trailer) e um destaque vivo. As da seed foram extraídas dos pixels de cada pôster e
// ajustadas no olho (ex.: o laranja do letreiro do Backup em vez do azul do céu).
// Filme sem pôster conhecido usa uma paleta montada a partir do tom dele (arteFilme).
import type { Filme } from '@/models/tipos';
import { corDoFilme } from '@/ui/arteFilme';

export type PaletaFilme = {
  /** fundo da abertura da página, sempre escuro (o texto por cima é branco) */
  fundo: string;
  /** meio-termo, pra blocos maiores de cor */
  medio: string;
  /** cor viva do pôster: detalhes, dia escolhido */
  destaque: string;
  /** texto em cima do destaque */
  sobreDestaque: string;
};

const DOS_POSTERES: Record<string, PaletaFilme> = {
  'de-volta-para-o-backup.jpg': { fundo: '#13202B', medio: '#2B4A60', destaque: '#F5A524', sobreDestaque: '#1C1206' },
  'forrest-commit.jpg': { fundo: '#1F231A', medio: '#4C5737', destaque: '#A6D47F', sobreDestaque: '#16200E' },
  'o-poderoso-chatbot.jpg': { fundo: '#1C2023', medio: '#3E4A52', destaque: '#8CC3F7', sobreDestaque: '#0C1A26' },
  'o-silencio-dos-servidores.jpg': { fundo: '#0D1C2E', medio: '#264973', destaque: '#5AB4FA', sobreDestaque: '#06192B' },
  'procurando-o-bug.jpg': { fundo: '#0C2434', medio: '#1F5C80', destaque: '#FFD23F', sobreDestaque: '#2A2000' },
  'velozes-e-compilados.jpg': { fundo: '#260E0B', medio: '#6E2A22', destaque: '#FF6B5B', sobreDestaque: '#2B0905' },
};

function paraHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function deHsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// pega o nome do arquivo de "/posteres/x.jpg" ou de uma URL qualquer
function arquivoDoPoster(poster: string | null | undefined): string | null {
  if (!poster) return null;
  const limpo = poster.split(/[?#]/)[0] ?? '';
  return limpo.split('/').pop() ?? null;
}

export function paletaDoFilme(filme: Pick<Filme, 'titulo' | 'id' | 'posterUrl'>): PaletaFilme {
  const arquivo = arquivoDoPoster(filme.posterUrl);
  const pronta = arquivo ? DOS_POSTERES[arquivo] : undefined;
  if (pronta) return pronta;
  const [h, s] = paraHsl(corDoFilme(filme.titulo, filme.id));
  return {
    fundo: deHsl(h, Math.min(s, 0.4), 0.14),
    medio: deHsl(h, Math.min(s, 0.4), 0.3),
    destaque: deHsl(h, Math.max(s, 0.55), 0.68),
    sobreDestaque: deHsl(h, 0.5, 0.1),
  };
}
