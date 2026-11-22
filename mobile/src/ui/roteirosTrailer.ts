// Texto dos trailers. Os filmes da seed têm roteiro escrito à mão e um estilo próprio;
// filme novo cadastrado na gerência ganha roteiro montado da sinopse e o estilo pelo gênero.
import type { Filme } from '@/models/tipos';

export type NomeEstilo = 'corrida' | 'oceano' | 'diario' | 'silencio' | 'conversa' | 'tempo' | 'classico';

export type Roteiro = {
  estilo: NomeEstilo;
  frases: [string, string, string, string];
  /** frase de efeito do cartaz, mostrada também na página do filme */
  tagline?: string;
  /** estilo conversa: o que a pessoa pergunta e o que responde depois */
  pergunta?: string;
  replica?: string;
  /** estilo tempo: de que ano pra que ano a viagem volta */
  anos?: [number, number];
};

const ESCRITOS: Record<string, Roteiro> = {
  'velozes e compilados': {
    estilo: 'corrida',
    frases: ['Sexta-feira. 17h20.', 'Cada build leva quarenta minutos.', 'Sem testes. Sem freio.', 'O deploy não espera.'],
    tagline: 'O deploy não espera.',
  },
  'procurando o bug': {
    estilo: 'oceano',
    frases: ['A produção caiu.', 'Num oceano de logs…', 'um peixinho testador', 'vai até o fundo do stack trace.'],
    tagline: 'Todo bug tem um esconderijo.',
  },
  'forrest commit': {
    estilo: 'diario',
    frases: ['Ele nunca pediu code review.', 'Fez commit direto na main.', 'E mudou a história da empresa.', 'A vida é como um repositório.'],
    tagline: 'Você nunca sabe o que vai encontrar no próximo merge.',
  },
  'o silêncio dos servidores': {
    estilo: 'silencio',
    frases: ['03:00', 'Os servidores pararam de responder.', 'O plantonista achou que estava sozinho.', 'Não estava.'],
    tagline: 'Às três da manhã, ninguém responde ao ping.',
  },
  'o poderoso chatbot': {
    estilo: 'conversa',
    frases: ['Ele responde a todos.', 'Pela família inteira.', 'Sempre em tom de conselho.', 'Uma resposta que você não pode recusar.'],
    tagline: 'Uma resposta que você não pode recusar.',
    pergunta: 'Padrinho, posso pedir uma coisa?',
    replica: 'E se eu disser não?',
  },
  'de volta para o backup': {
    estilo: 'tempo',
    frases: ['A cidade vai perder seus arquivos.', 'O último backup ficou no passado.', 'Só existe um jeito de voltar.', 'Ninguém fez o backup. Ainda.'],
    tagline: 'Ninguém fez o backup. Ainda.',
    anos: [2026, 1985],
  },
};

// gênero cadastrado vira um estilo parecido
function estiloDoGenero(genero: string): NomeEstilo {
  const g = genero.toLowerCase();
  if (/a[çc][ãa]o|aventura|corrida/.test(g)) return 'corrida';
  if (/anima|infantil|fam[íi]lia/.test(g)) return 'oceano';
  if (/drama|romance|biograf/.test(g)) return 'diario';
  if (/suspense|terror|horror|mist[ée]rio|thriller/.test(g)) return 'silencio';
  if (/com[ée]dia/.test(g)) return 'conversa';
  if (/fic[çc][ãa]o|sci|fantasia/.test(g)) return 'tempo';
  return 'classico';
}

// quebra a sinopse em até 4 pedaços curtos, pelas vírgulas e pontos
function daSinopse(filme: Pick<Filme, 'titulo' | 'sinopse' | 'genero'>): Roteiro {
  const pedacos = filme.sinopse
    .split(/[.,;:!?]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  const frases: string[] = [];
  for (const p of pedacos) {
    if (frases.length === 4) break;
    // pedaço longo vira dois, pra caber na tela
    const palavras = p.split(/\s+/);
    if (palavras.length > 9 && frases.length < 3) {
      const meio = Math.ceil(palavras.length / 2);
      frases.push(palavras.slice(0, meio).join(' ') + '…', palavras.slice(meio).join(' '));
    } else {
      frases.push(p);
    }
  }
  const reserva = [filme.genero, filme.titulo, 'Uma produção CineON', 'Em breve na tela grande'];
  while (frases.length < 4) frases.push(reserva[frases.length]!);
  return { estilo: estiloDoGenero(filme.genero), frases: frases.slice(0, 4) as Roteiro['frases'] };
}

export function roteiroDoFilme(filme: Pick<Filme, 'titulo' | 'sinopse' | 'genero'>): Roteiro {
  return ESCRITOS[filme.titulo.trim().toLowerCase()] ?? daSinopse(filme);
}
