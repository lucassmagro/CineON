// Estilo "clássico": o trailer de antes, pra gênero que não tem estilo próprio. Pôster em pé
// sobre o fundo desfocado, frases subindo, a cor do filme com um traço e o título com faixas.
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cartao, Cena, cheio, Fecho, Ficha, Fundo, prog, Surge, type PropsEstilo } from './base';

const ABRE = [0, 2600] as const;
const C1 = [2600, 7200] as const;
const C2 = [7200, 11800] as const;
const C3 = [11800, 16400] as const;
const C4 = [16400, 21000] as const;
const TIT = [21000, 27000] as const;

export function Classico({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(46, Math.max(22, largura * 0.062)));
  const frase = [estilos.frase, { fontSize: g, lineHeight: Math.round(g * 1.12) }];
  const { frases } = roteiro;
  const alturaCartao = altura * 0.76;

  return (
    <>
      <Cena t={t} janela={ABRE}>
        <View style={[cheio, estilos.centro]}>
          <Aparece t={t} ini={300} dur={800}>
            <Text style={estilos.rotulo}>CINEON APRESENTA</Text>
          </Aparece>
        </View>
      </Cena>

      <Cena t={t} janela={C1}>
        <Fundo t={t} janela={C1} m={m} uri={poster} cor={paleta.medio} zoom={[1.25, 1.35]} escurece={0.55} desfoque={22} />
        <Cartao uri={poster} cor={paleta.medio} altura={alturaCartao} estilo={{ position: 'absolute', right: largura * 0.07, top: altura * 0.12 }} />
        <View style={{ position: 'absolute', left: largura * 0.07, right: largura * 0.07 + (alturaCartao * 2) / 3 + 20, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Surge t={t} ini={C1[0] + 700} m={m} texto={frases[0]} estilo={frase} />
        </View>
      </Cena>

      <Cena t={t} janela={C2}>
        <Fundo t={t} janela={C2} m={m} uri={poster} cor={paleta.medio} zoom={[1.5, 1.4]} lado={[0.08, -0.08]} desloca={[0.05, -0.05]} escurece={0.5} desfoque={30} />
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.08 }]}>
          <Surge t={t} ini={C2[0] + 260} m={m} texto={frases[1]} estilo={[frase, { textAlign: 'center' }]} />
        </View>
      </Cena>

      <Cena t={t} janela={C3} fundo={paleta.medio}>
        <View style={[cheio, { justifyContent: 'center', paddingHorizontal: largura * 0.08 }]}>
          <Surge t={t} ini={C3[0] + 260} m={m} texto={frases[2]} estilo={[frase, { fontSize: g * 1.08 }]} />
          <Traco t={t} ini={C3[0] + 700} largura={largura * 0.22} />
        </View>
      </Cena>

      <Cena t={t} janela={C4}>
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.08 }]}>
          <Luz t={t} janela={C4} largura={largura * 0.5} />
          <Surge t={t} ini={C4[0] + 500} m={m} texto={frases[3]} estilo={[frase, { fontSize: g * 0.78, textAlign: 'center' }]} />
        </View>
      </Cena>

      <Cena t={t} janela={TIT}>
        <Fundo t={t} janela={TIT} m={m} uri={poster} cor={paleta.medio} zoom={[1.4, 1.25]} escurece={0.62} desfoque={26} />
        <View style={[estilos.faixa, { top: 0, height: altura * 0.1 }]} />
        <View style={[estilos.faixa, { bottom: 0, height: altura * 0.1 }]} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.06, paddingHorizontal: largura * 0.06 }]}>
          <Surge t={t} ini={TIT[0] + 200} m={m} texto={filme.titulo} estilo={[estilos.titulo, { fontSize: g * 1.25, lineHeight: g * 1.32 }]} />
          <Aparece t={t} ini={TIT[0] + 1500} dur={800}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.38)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor="rgba(255,255,255,0.72)" />
    </>
  );
}

function Traco({ t, ini, largura }: { t: SharedValue<number>; ini: number; largura: number }) {
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: prog(t.get(), ini, ini + 1200) }] }));
  return <Animated.View style={[estilos.traco, { width: largura }, a]} />;
}

function Luz({ t, janela, largura }: { t: SharedValue<number>; janela: readonly [number, number]; largura: number }) {
  const [ini, fim] = janela;
  const a = useAnimatedStyle(() => {
    const v = t.get();
    return { opacity: prog(v, ini, ini + 300) * (1 - 0.6 * prog(v, fim - 600, fim)), transform: [{ scaleX: 0.02 + 0.98 * prog(v, ini, ini + 1400) }] };
  });
  return <Animated.View style={[estilos.luz, { width: largura }, a]} />;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  rotulo: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600', letterSpacing: 3.2 },
  frase: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.6 },
  titulo: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -1, textAlign: 'center' },
  traco: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)', marginTop: 18, transformOrigin: 'left' },
  luz: { height: 1.5, backgroundColor: '#FFFFFF', marginBottom: 22 },
  faixa: { position: 'absolute', left: 0, right: 0, backgroundColor: '#000' },
});
