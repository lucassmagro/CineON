// Preferência de aparência do app: seguir o sistema, sempre claro ou sempre escuro.
import { createContext, useContext } from 'react';

export type Aparencia = 'sistema' | 'claro' | 'escuro';

export type ValorAparencia = {
  preferencia: Aparencia;
  escuro: boolean;
  definir: (aparencia: Aparencia) => void;
  alternar: () => void;
};

export const ContextoAparencia = createContext<ValorAparencia | null>(null);

export function useAparencia(): ValorAparencia {
  const valor = useContext(ContextoAparencia);
  if (!valor) throw new Error('useAparencia precisa estar dentro de <TemaProvider>');
  return valor;
}
