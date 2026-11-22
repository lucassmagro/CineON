import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao, textoClassificacao } from '@/components/SeloClassificacao';
import { SeletorDia } from '@/components/SeletorDia';
import { Trailer } from '@/components/Trailer';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Carregando, MensagemErro, Tela, Texto, Vazio } from '@/ui/componentes';
import { espaco, larguraLeitura, useMargem, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { chaveDia, dinheiro, duracao, hora } from '@/utils/formatar';

const LARGURA_MIN_HORARIO = 104;
const GAP = 10;

export default function DetalheFilme() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const { width } = useWindowDimensions();
  const vm = useCarregar(() => filmeService.buscar(Number(id)), [id]);
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !vm.dados) return <MensagemErro mensagem={vm.erro ?? 'Filme não encontrado'} aoTentarDeNovo={vm.recarregar} />;

  const filme = vm.dados;
  const dias = [...new Set(filme.sessoes.map((s) => chaveDia(s.inicio)))];
  const dia = diaEscolhido && dias.includes(diaEscolhido) ? diaEscolhido : (dias[0] ?? null);
  const sessoesDoDia = filme.sessoes.filter((s) => chaveDia(s.inicio) === dia);

  // grade de horários: quantas colunas cabem na largura disponível
  const disponivel = Math.min(width, larguraLeitura) - 2 * margem;
  const colunas = Math.max(2, Math.floor((disponivel + GAP) / (LARGURA_MIN_HORARIO + GAP)));
  const larguraHorario = Math.floor((disponivel - GAP * (colunas - 1)) / colunas);
  const larga = width >= 600;

  return (
    <Tela>
      <Stack.Screen options={{ title: '' }} />

      <View style={[estilos.topo, { paddingHorizontal: margem }]}>
        <Arte titulo={filme.titulo} id={filme.id} poster={filme.posterUrl} estilo={{ width: larga ? 168 : 118 }} />
        <View style={estilos.info}>
          <Texto tipo={larga ? 'titulo1' : 'titulo2'}>{filme.titulo}</Texto>
          <Texto tipo="subtitulo" cor="secundario">
            {filme.genero}
          </Texto>
          <View style={estilos.meta}>
            <SeloClassificacao valor={filme.classificacao} tamanho={20} />
            <Texto tipo="subtitulo" cor="secundario">
              {duracao(filme.duracaoMin)}
            </Texto>
          </View>
        </View>
      </View>

      {filme.sinopse ? (
        <View style={{ paddingHorizontal: margem, gap: espaco.s, marginBottom: espaco.xxl }}>
          <Texto tipo="corpo" style={{ lineHeight: 24 }}>
            {filme.sinopse}
          </Texto>
          <Texto tipo="nota" cor="secundario">
            {textoClassificacao(filme.classificacao)}
          </Texto>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: margem, gap: espaco.m, marginBottom: espaco.xxl }}>
        <Texto tipo="titulo2">Trailer</Texto>
        <Trailer filme={filme} largura={disponivel} />
      </View>

      <View style={[estilos.divisor, { backgroundColor: c.separador, marginHorizontal: margem }]} />

      <Texto tipo="titulo2" style={{ paddingHorizontal: margem, marginBottom: espaco.l }}>
        Sessões
      </Texto>

      {dias.length === 0 ? (
        <Vazio icone="calendar-outline" titulo="Sem sessões futuras" texto="Volte mais tarde para ver a nova programação." />
      ) : (
        <>
          <SeletorDia dias={dias} valor={dia} aoMudar={setDiaEscolhido} />
          <View style={[estilos.horarios, { paddingHorizontal: margem, gap: GAP }]}>
            {sessoesDoDia.map((s) => (
              <Tocavel
                key={s.id}
                onPress={() => router.push({ pathname: '/sessao/[id]', params: { id: s.id } })}
                escala={0.95}
                escalaHover={1.02}
                accessibilityRole="button"
                accessibilityLabel={`Sessão das ${hora(s.inicio)}, ${s.sala.nome}, ${dinheiro(s.preco)}`}
                estiloPressionado={{ backgroundColor: c.preenchimentoForte }}
                style={[estilos.horario, { width: larguraHorario, backgroundColor: c.fundoElevado }]}>
                <Texto tipo="titulo3" peso="600" style={{ fontVariant: ['tabular-nums'] }}>
                  {hora(s.inicio)}
                </Texto>
                <Texto tipo="nota" cor="secundario">
                  {s.sala.nome}
                </Texto>
                <Texto tipo="nota" cor="secundario">
                  {dinheiro(s.preco)}
                </Texto>
              </Tocavel>
            ))}
          </View>
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', gap: espaco.l, alignItems: 'flex-end', marginTop: espaco.s, marginBottom: espaco.xl },
  info: { flex: 1, gap: 4, paddingBottom: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, marginTop: 4 },
  divisor: { height: StyleSheet.hairlineWidth, marginBottom: espaco.xxl },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', marginTop: espaco.l },
  horario: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, gap: 1 },
});
