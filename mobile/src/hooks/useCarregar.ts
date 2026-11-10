// Hook que as telas usam pra buscar dados: devolve dados, carregando, erro e recarregar.
// Também recarrega quando a tela volta a ficar em foco (ex.: voltou de um formulário).
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mensagemDe } from '@/services/api';

type Resultado<T> = { chave: string; dados: T | null; erro: string | null };

export function useCarregar<T>(buscar: () => Promise<T>, dependencias: unknown[] = []) {
  const chave = JSON.stringify(dependencias);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [versao, setVersao] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  });

  useEffect(() => {
    let ativo = true;
    buscarRef
      .current()
      .then(
        (dados) => ativo && setResultado({ chave, dados, erro: null }),
        // se falhar uma atualização, mantém o que já estava na tela
        (e) => ativo && setResultado((ant) => ({ chave, dados: ant?.chave === chave ? ant.dados : null, erro: mensagemDe(e) })),
      )
      .finally(() => ativo && setAtualizando(false));
    return () => {
      ativo = false;
    };
  }, [chave, versao]);

  const primeiraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeiraVez.current) {
        primeiraVez.current = false;
        return;
      }
      setVersao((v) => v + 1);
    }, []),
  );

  const atual = resultado?.chave === chave ? resultado : null;
  return {
    dados: atual?.dados ?? null,
    carregando: atual === null,
    atualizando,
    erro: atual && atual.dados === null ? atual.erro : null,
    recarregar: useCallback(() => {
      setAtualizando(true);
      setVersao((v) => v + 1);
    }, []),
    recarregarSilencioso: useCallback(() => setVersao((v) => v + 1), []),
  };
}
