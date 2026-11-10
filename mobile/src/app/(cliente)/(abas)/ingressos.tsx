import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Arte } from '@/components/Arte';
import { Passe } from '@/components/Passe';
import { useCarregar } from '@/hooks/useCarregar';
import { useAgora } from '@/hooks/useContagem';
import type { Ingresso } from '@/models/tipos';
import { ingressoService } from '@/services/cineon';
import { Botao, Carregando, Linha, MensagemErro, Secao, Tela, Texto, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';
import { dataHora } from '@/utils/formatar';

type Grupo = { sessaoId: number; ingressos: Ingresso[] };

// um passe por sessão, como a Wallet faz com ingressos da mesma compra
function agruparPorSessao(lista: Ingresso[]): Grupo[] {
  const grupos = new Map<number, Ingresso[]>();
  for (const i of lista) grupos.set(i.sessao.id, [...(grupos.get(i.sessao.id) ?? []), i]);
  return [...grupos.entries()].map(([sessaoId, ingressos]) => ({
    sessaoId,
    ingressos: ingressos.sort((a, b) => a.assento.localeCompare(b.assento, 'pt-BR', { numeric: true })),
  }));
}

export default function MeusIngressos() {
  const vm = useCarregar(ingressoService.meus);
  const agora = useAgora(60_000);
  const c = useTema();
  const margem = useMargem();
  const router = useRouter();
  const [aberto, setAberto] = useState<number | null>(null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  const todos = vm.dados ?? [];
  const valido = (i: Ingresso) => i.status === 'VALIDO' && new Date(i.sessao.fim).getTime() > agora;
  const proximos = agruparPorSessao(todos.filter(valido)).sort((a, b) =>
    a.ingressos[0]!.sessao.inicio.localeCompare(b.ingressos[0]!.sessao.inicio),
  );
  const anteriores = agruparPorSessao(todos.filter((i) => !valido(i))).sort((a, b) =>
    b.ingressos[0]!.sessao.inicio.localeCompare(a.ingressos[0]!.sessao.inicio),
  );
  const sessaoAberta = aberto !== null && proximos.some((g) => g.sessaoId === aberto) ? aberto : proximos[0]?.sessaoId;

  return (
    <Tela semCabecalho titulo="Ingressos" aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      {todos.length === 0 ? (
        <Vazio
          icone="ticket-outline"
          titulo="Nenhum ingresso ainda"
          texto="Quando você comprar, os ingressos ficam guardados aqui."
          acao={<Botao titulo="Ver filmes em cartaz" variante="tingido" compacto aoTocar={() => router.navigate('/filmes')} />}
        />
      ) : null}

      {proximos.length > 0 ? (
        <View style={{ paddingHorizontal: margem, gap: espaco.s, marginBottom: espaco.xxl }}>
          {proximos.map((g) => {
            const s = g.ingressos[0]!.sessao;
            const recolhido = g.sessaoId !== sessaoAberta;
            return (
              <Passe
                key={g.sessaoId}
                filme={s.filme.titulo}
                filmeId={s.filme.id}
                inicio={s.inicio}
                sala={s.sala.nome}
                itens={g.ingressos}
                corFundo={c.fundo}
                recolhido={recolhido}
                aoTocar={recolhido ? () => setAberto(g.sessaoId) : undefined}
              />
            );
          })}
        </View>
      ) : todos.length > 0 ? (
        <Vazio icone="ticket-outline" titulo="Nenhuma sessão por vir" texto="Os ingressos de sessões que já passaram estão logo abaixo." />
      ) : null}

      {anteriores.length > 0 ? (
        <Secao titulo="Anteriores">
          {anteriores.slice(0, 20).map((g, indice, lista) => {
            const s = g.ingressos[0]!.sessao;
            const usados = g.ingressos.filter((i) => i.status === 'UTILIZADO').length;
            const total = g.ingressos.length;
            return (
              <Linha
                key={g.sessaoId}
                esquerda={<Arte titulo={s.filme.titulo} id={s.filme.id} poster={s.filme.posterUrl} mini />}
                titulo={s.filme.titulo}
                subtitulo={dataHora(s.inicio)}
                direita={
                  <Texto tipo="nota" cor="secundario">
                    {usados === total ? (total === 1 ? 'Usado' : `${total} usados`) : `${total} ${total === 1 ? 'ingresso' : 'ingressos'}`}
                  </Texto>
                }
                ultima={indice === lista.length - 1}
              />
            );
          })}
        </Secao>
      ) : null}
    </Tela>
  );
}

