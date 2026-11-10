import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao } from '@/components/SeloClassificacao';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Surgir } from '@/ui/animacoes';
import { Carregando, MensagemErro, Tela, Texto, Vazio } from '@/ui/componentes';
import { espaco, larguraGrade, useMargem } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { duracao } from '@/utils/formatar';

const GAP = 16;

export default function EmCartaz() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const margem = useMargem();
  const vm = useCarregar(filmeService.emCartaz);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const filmes = vm.dados ?? [];

  // colunas pela largura disponível: 2 no celular, até 6 no desktop
  const largura = Math.min(width, larguraGrade);
  const colunas = Math.max(2, Math.min(6, Math.floor((largura - 2 * margem + GAP) / (150 + GAP))));
  const larguraCartaz = Math.floor((largura - 2 * margem - GAP * (colunas - 1)) / colunas);

  return (
    <Tela
      semCabecalho
      largura={larguraGrade}
      titulo="Em cartaz"
      subtitulo={filmes.length > 0 ? `${filmes.length} ${filmes.length === 1 ? 'filme' : 'filmes'} com sessões disponíveis` : undefined}
      aoAtualizar={vm.recarregar}
      atualizando={vm.atualizando}>
      {filmes.length === 0 ? (
        <Vazio icone="film-outline" titulo="Nenhuma sessão por enquanto" texto="Assim que a programação for publicada, os filmes aparecem aqui." />
      ) : (
        <View style={[estilos.grade, { paddingHorizontal: margem, columnGap: GAP }]}>
          {filmes.map((f, i) => (
            <Surgir key={f.id} indice={i} style={{ width: larguraCartaz }}>
            <Tocavel
              onPress={() => router.push({ pathname: '/filme/[id]', params: { id: f.id } })}
              escala={0.96}
              escalaHover={1.03}
              accessibilityRole="button"
              accessibilityLabel={`${f.titulo}, ${f.genero}, ${duracao(f.duracaoMin)}`}>
              <Arte titulo={f.titulo} id={f.id} poster={f.posterUrl} genero={f.genero} />
              <View style={estilos.meta}>
                <SeloClassificacao valor={f.classificacao} tamanho={16} />
                <Texto tipo="nota" cor="secundario">
                  {duracao(f.duracaoMin)}
                </Texto>
              </View>
            </Tocavel>
            </Surgir>
          ))}
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: espaco.s },
});
