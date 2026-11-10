import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Carregando, Grupo, Linha, MensagemErro, Tela, Vazio } from '@/ui/componentes';
import { cores, espaco, fonte } from '@/ui/tema';
import { agruparPorDia, dinheiro, hora } from '@/utils/formatar';

export default function DetalheFilme() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vm = useCarregar(() => filmeService.buscar(Number(id)), [id]);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !vm.dados) return <MensagemErro mensagem={vm.erro ?? 'Filme não encontrado'} aoTentarDeNovo={vm.recarregar} />;
  const filme = vm.dados;
  const dias = agruparPorDia(filme.sessoes, (s) => s.inicio);

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ title: filme.titulo }} />
      <View style={estilos.cabecalho}>
        <Text style={fonte.titulo}>{filme.titulo}</Text>
        <Text style={estilos.meta}>
          {filme.genero} · {filme.duracaoMin} min · {filme.classificacao === 'L' ? 'Livre' : `${filme.classificacao} anos`}
        </Text>
        {filme.sinopse ? <Text style={estilos.sinopse}>{filme.sinopse}</Text> : null}
      </View>

      {dias.length === 0 ? <Vazio texto="Não há sessões futuras para este filme." /> : null}
      {dias.map((d) => (
        <Grupo key={d.dia} titulo={d.dia}>
          {d.itens.map((s, i) => (
            <Linha
              key={s.id}
              titulo={hora(s.inicio)}
              subtitulo={s.sala.nome}
              valor={dinheiro(s.preco)}
              aoTocar={() => router.push({ pathname: '/sessao/[id]', params: { id: s.id } })}
              ultima={i === d.itens.length - 1}
            />
          ))}
        </Grupo>
      ))}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { paddingHorizontal: espaco.xl, marginBottom: espaco.xl, gap: 6 },
  meta: { ...fonte.secundario, color: cores.textoSecundario },
  sinopse: { ...fonte.corpo, lineHeight: 23, marginTop: espaco.s },
});
