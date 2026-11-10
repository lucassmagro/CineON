// Contêiner dos toasts da Web, com as cores e o jeito do resto do app.
import type { CSSProperties } from 'react';
import { Slide, ToastContainer } from 'react-toastify';

import { useTema } from './tema';

const CSS = `
.Toastify .Toastify__toast {
  border-radius: 16px;
  padding: 14px 16px;
  min-height: 0;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 0.5px solid var(--cineon-toast-borda);
}
.Toastify .Toastify__toast-body { padding: 0; margin: 0; align-items: flex-start; }
.Toastify .Toastify__toast-icon { margin-inline-end: 12px; width: 22px; }
.Toastify .Toastify__progress-bar { height: 3px; opacity: 0.55; }
@media (max-width: 480px) {
  .Toastify .Toastify__toast-container .Toastify__toast {
    width: calc(100vw - 24px) !important;
    margin: 12px auto 0 !important;
    border-radius: 16px !important;
  }
}
.cineon-toast-botao { transition: transform 160ms cubic-bezier(0.2, 0, 0, 1), filter 160ms; }
.cineon-toast-botao:hover { filter: brightness(0.94); }
.cineon-toast-botao:active { transform: scale(0.97); }
`;

export function Toasts() {
  const c = useTema();
  // as variáveis do react-toastify apontam pras cores do tema do app
  const variaveis = {
    '--toastify-color-light': c.fundoElevado,
    '--toastify-color-dark': c.fundoElevado,
    '--toastify-text-color-light': c.rotulo,
    '--toastify-text-color-dark': c.rotulo,
    '--toastify-color-success': c.verde,
    '--toastify-color-error': c.vermelho,
    '--toastify-color-info': c.azul,
    '--toastify-color-progress-light': c.azul,
    '--toastify-color-progress-dark': c.azul,
    '--toastify-toast-width': '380px',
    '--toastify-font-family': 'inherit',
    '--cineon-toast-borda': c.separador,
  } as CSSProperties;

  return (
    <>
      <style>{CSS}</style>
      <ToastContainer
        position="top-center"
        theme={c.escuro ? 'dark' : 'light'}
        transition={Slide}
        limit={3}
        autoClose={4000}
        pauseOnFocusLoss={false}
        style={variaveis}
      />
    </>
  );
}
