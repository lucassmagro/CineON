// Mapa da sessão + assentos selecionados. Atualiza a cada 5s pra mostrar o que os outros reservaram.
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { ErroApi, mensagemDe } from '@/services/api';
import { reservaService, sessaoService } from '@/services/cineon';

import { useCarregar } from './useCarregar';

const INTERVALO_MS = 5_000;
export const MAX_ASSENTOS = 10;

export function useMapaAssentos(sessaoId: number) {
  const mapa = useCarregar(() => sessaoService.mapa(sessaoId), [sessaoId]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [reservando, setReservando] = useState(false);
  const { recarregarSilencioso } = mapa;

  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => void recarregarSilencioso(), INTERVALO_MS);
      return () => clearInterval(timer);
    }, [recarregarSilencioso]),
  );

  // se alguém pegou um assento que estava selecionado, tira da seleção
  const livres = useMemo(() => {
    const ids = new Set<number>();
    for (const f of mapa.dados?.filas ?? []) for (const a of f.assentos) if (a.status === 'LIVRE') ids.add(a.id);
    return ids;
  }, [mapa.dados]);
  const selecaoValida = selecionados.filter((id) => livres.has(id));

  const rotulos = useMemo(() => {
    const nomes = new Map<number, string>();
    for (const f of mapa.dados?.filas ?? []) for (const a of f.assentos) nomes.set(a.id, `${f.fila}${a.numero}`);
    return selecaoValida.map((id) => nomes.get(id) ?? '').sort();
  }, [mapa.dados, selecaoValida]);

  const alternar = useCallback((assentoId: number) => {
    setSelecionados((atual) => {
      if (atual.includes(assentoId)) return atual.filter((id) => id !== assentoId);
      if (atual.length >= MAX_ASSENTOS) return atual;
      return [...atual, assentoId];
    });
  }, []);

  const reservar = useCallback(
    async (nomeCliente?: string): Promise<{ reservaId?: number; erro?: string }> => {
      setReservando(true);
      try {
        const reserva = await reservaService.reservar({ sessaoId, assentoIds: selecaoValida, nomeCliente });
        setSelecionados([]);
        return { reservaId: reserva.id };
      } catch (e) {
        if (e instanceof ErroApi && e.status === 409) recarregarSilencioso();
        return { erro: mensagemDe(e) };
      } finally {
        setReservando(false);
      }
    },
    [sessaoId, selecaoValida, recarregarSilencioso],
  );

  return { ...mapa, selecionados: selecaoValida, rotulos, alternar, reservar, reservando };
}
