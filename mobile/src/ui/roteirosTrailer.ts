// Texto dos trailers. Os filmes da seed têm roteiro escrito à mão; filme novo cadastrado
// na gerência ganha um roteiro montado a partir da sinopse.
import type { Filme } from '@/models/tipos';

export type Roteiro = { frases: [string, string, string, string] };

const ESCRITOS: Record<string, Roteiro> = {
  'velozes e compilados': {
    frases: ['Sexta-feira. 17h20.', 'Cada build leva quarenta minutos.', 'Sem testes. Sem freio.', 'O deploy não espera.'],
  },
  'forrest commit': {
    frases: ['Ele nunca pediu code review.', 'Fez commit direto na main.', 'E mudou a história da empresa.', 'A vida é como um repositório.'],
  },
  'procurando o bug': {
    frases: ['A produção caiu.', 'Num oceano de logs…', 'um peixinho testador', 'vai até o fundo do stack trace.'],
  },
  'o silêncio dos servidores': {
    frases: ['03:00.', 'Os servidores pararam de responder.', 'O plantonista achou que estava sozinho.', 'Não estava.'],
  },
  'o poderoso chatbot': {
    frases: ['Ele responde a todos.', 'Pela família inteira.', 'Sempre em tom de conselho.', 'Uma resposta que você não pode recusar.'],
  },
  'de volta para o backup': {
    frases: ['A cidade vai perder seus arquivos.', 'O último backup ficou no passado.', 'Só existe um jeito de voltar.', 'Ninguém fez o backup. Ainda.'],
  },
};

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
  return { frases: frases.slice(0, 4) as Roteiro['frases'] };
}

export function roteiroDoFilme(filme: Pick<Filme, 'titulo' | 'sinopse' | 'genero'>): Roteiro {
  return ESCRITOS[filme.titulo.trim().toLowerCase()] ?? daSinopse(filme);
}
