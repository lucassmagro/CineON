// Na Web a troca de tema é um esmaecimento cruzado da página inteira (View Transitions API),
// como o macOS faz ao mudar a aparência. Devolve false quando o navegador não suporta, e aí
// o TemaProvider usa o véu que esmaece.
import { flushSync } from 'react-dom';

type DocumentoComTransicao = Document & {
  startViewTransition?: (atualizar: () => void) => { finished: Promise<void> };
};

let estiloPronto = false;

// a foto do tema antigo some por cima do tema novo, que já fica inteiro embaixo:
// assim não aparece aquele "meio transparente" no meio da troca
const CSS = `
::view-transition-old(root), ::view-transition-new(root) { mix-blend-mode: normal; }
::view-transition-new(root) { animation: none; }
::view-transition-old(root) { animation: cineon-tema-sai 460ms cubic-bezier(0.2, 0, 0, 1) both; }
@keyframes cineon-tema-sai { to { opacity: 0; } }
`;

export function transicaoSuave(aplicar: () => void): boolean {
  const doc = document as DocumentoComTransicao;
  if (typeof doc.startViewTransition !== 'function') return false;

  if (!estiloPronto) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    estiloPronto = true;
  }

  // o React precisa aplicar o tema novo dentro do callback, de forma síncrona
  doc.startViewTransition(() => flushSync(aplicar)).finished.catch(() => {});
  return true;
}
