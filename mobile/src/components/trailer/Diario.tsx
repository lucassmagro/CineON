// Estilo "diário" (drama): calmo, com serifa e esmaecimentos longos. Um terminal digitando
// git log, o grafo de commits crescendo e a frase final entre dois fios.
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cena, cheio, Digitado, Fecho, Ficha, Fundo, mono, prog, serifa, Surge, suave, type PropsEstilo } from './base';

const ABRE = [0, 3200] as const;
const C1 = [3200, 8800] as const;
const C2 = [8800, 13800] as const;
const C3 = [13800, 19000] as const;
const C4 = [19000, 23000] as const;
const TIT = [23000, 27000] as const;
const TROCA = 700;

const COMMITS = [
  ['a1f3c9e', 'primeiro dia'],
  ['5b20d71', 'corrige tudo (eu acho)'],
  ['7c1e9a2', 'direto na main'],
  ['e04b8f3', 'muda a história'],
  ['91d6c0a', 'segue em frente'],
] as const;

export function Diario({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(44, Math.max(22, largura * 0.06)));
  const verde = paleta.destaque;
  const texto = [serifa, estilos.serifa, { fontSize: g, lineHeight: Math.round(g * 1.2) }];
  const { frases } = roteiro;
  // a linha do commit tem que caber numa linha só
  const comando = `git commit -m "${frases[2]}"`;
  const tamComando = Math.max(9, Math.min(g * 0.5, (largura * 0.78) / (comando.length * 0.62)));

  return (
    <>
      <Cena t={t} janela={ABRE} troca={TROCA}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.1 }]}>
          <View style={estilos.linha}>
            <Text style={[mono, { color: 'rgba(255,255,255,0.5)', fontSize: g * 0.5 }]}>$ </Text>
            <Digitado t={t} ini={400} duracao={1300} texto="git log --oneline" estilo={[mono, { color: verde, fontSize: g * 0.5 }]} corCursor={verde} />
          </View>
          <Aparece t={t} ini={1900} dur={900}>
            <Text style={estilos.rotulo}>CINEON APRESENTA</Text>
          </Aparece>
        </View>
      </Cena>

      <Cena t={t} janela={C1} troca={TROCA} fundo={paleta.fundo}>
        <View style={[cheio, estilos.linha, { paddingHorizontal: largura * 0.07, gap: largura * 0.05 }]}>
          <Grafo t={t} ini={C1[0] + 200} altura={altura * 0.66} cor={verde} tamanho={Math.max(9, g * 0.34)} />
          <View style={{ flex: 1 }}>
            <Surge t={t} ini={C1[0] + 1200} m={m} modo="lento" texto={frases[0]} estilo={texto} />
          </View>
        </View>
      </Cena>

      <Cena t={t} janela={C2} troca={TROCA}>
        <Fundo t={t} janela={C2} m={m} uri={poster} cor={paleta.medio} zoom={[1.25, 1.36]} desloca={[0.12, 0.08]} escurece={0.5} desfoque={9} />
        <View style={[estilos.faixa, { top: 0, height: altura * 0.1 }]} />
        <View style={[estilos.faixa, { bottom: 0, height: altura * 0.1 }]} />
        <View style={{ position: 'absolute', left: largura * 0.08, right: largura * 0.08, bottom: altura * 0.18 }}>
          <Surge t={t} ini={C2[0] + 700} m={m} modo="lento" texto={frases[1]} estilo={texto} />
        </View>
      </Cena>

      <Cena t={t} janela={C3} troca={TROCA} fundo="#0B0D09">
        <View style={[cheio, estilos.centro]}>
          <View style={[estilos.terminal, { width: largura * 0.86, padding: largura * 0.035, gap: altura * 0.03 }]}>
            <View style={estilos.bolinhas}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <View key={c} style={[estilos.bolinha, { backgroundColor: c }]} />
              ))}
            </View>
            <View style={estilos.linha}>
              <Text style={[mono, { color: 'rgba(255,255,255,0.45)', fontSize: tamComando }]}>$ </Text>
              <Digitado t={t} ini={C3[0] + 500} duracao={2300} texto={comando} estilo={[mono, { color: '#E8E6DF', fontSize: tamComando }]} corCursor={verde} />
            </View>
            <Aparece t={t} ini={C3[0] + 3200} dur={500}>
              <Text style={[mono, { color: verde, fontSize: tamComando }]}>[main 7c1e9a2] 1 file changed, 1 history rewritten</Text>
            </Aparece>
          </View>
        </View>
      </Cena>

      <Cena t={t} janela={C4} troca={TROCA} fundo={paleta.fundo}>
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.1, gap: altura * 0.06 }]}>
          <Fio t={t} ini={C4[0] + 300} largura={largura * 0.32} cor={verde} />
          <Surge t={t} ini={C4[0] + 700} m={m} modo="lento" texto={`“${frases[3]}”`} estilo={[texto, { textAlign: 'center', fontSize: g * 1.1, lineHeight: g * 1.35 }]} />
          <Fio t={t} ini={C4[0] + 300} largura={largura * 0.32} cor={verde} />
        </View>
      </Cena>

      <Cena t={t} janela={TIT} troca={TROCA}>
        <Fundo t={t} janela={TIT} m={m} uri={poster} cor={paleta.medio} zoom={[1.3, 1.22]} escurece={0.62} desfoque={18} tinta={paleta.fundo} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.04, paddingHorizontal: largura * 0.08 }]}>
          <Aparece t={t} ini={TIT[0] + 300} dur={1000}>
            <Text style={[estilos.rotulo, { color: verde }]}>UM FILME CINEON</Text>
          </Aparece>
          <Surge t={t} ini={TIT[0] + 600} m={m} modo="lento" texto={filme.titulo} estilo={[serifa, estilos.titulo, { fontSize: g * 1.45, lineHeight: g * 1.6 }]} />
          <Aparece t={t} ini={TIT[0] + 2000} dur={900}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.38)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={verde} fundo={paleta.fundo} fonte={{ ...serifa, fontWeight: '400', letterSpacing: 0 }} />
    </>
  );
}

// a linha do tempo dos commits descendo, com uma bolinha e o hash de cada um
function Grafo({ t, ini, altura, cor, tamanho }: { t: SharedValue<number>; ini: number; altura: number; cor: string; tamanho: number }) {
  const linha = useAnimatedStyle(() => ({ transform: [{ scaleY: suave(prog(t.get(), ini, ini + 3600)) }] }));
  const passo = altura / (COMMITS.length - 1);
  return (
    <View style={{ height: altura, justifyContent: 'space-between' }}>
      <Animated.View style={[{ position: 'absolute', left: 6, top: 0, width: 2, height: altura, backgroundColor: cor, opacity: 0.5, transformOrigin: 'top' }, linha]} />
      {COMMITS.map(([hash, msg], i) => (
        <Aparece key={hash} t={t} ini={ini + (i * passo * 3600) / altura} dur={500}>
          <View style={estilos.linha}>
            <View style={[estilos.no, { borderColor: cor }]} />
            <Text style={[mono, { color: cor, fontSize: tamanho, marginLeft: 10 }]}>{hash}</Text>
            <Text style={[mono, { color: 'rgba(255,255,255,0.55)', fontSize: tamanho, marginLeft: 8 }]} numberOfLines={1}>
              {msg}
            </Text>
          </View>
        </Aparece>
      ))}
    </View>
  );
}

function Fio({ t, ini, largura, cor }: { t: SharedValue<number>; ini: number; largura: number; cor: string }) {
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: suave(prog(t.get(), ini, ini + 1400)) }] }));
  return <Animated.View style={[{ width: largura, height: StyleSheet.hairlineWidth * 2, backgroundColor: cor }, a]} />;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center' },
  serifa: { color: '#F2EFE6', fontStyle: 'italic' },
  titulo: { color: '#FFFFFF', textAlign: 'center' },
  rotulo: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', letterSpacing: 3.5 },
  faixa: { position: 'absolute', left: 0, right: 0, backgroundColor: '#000' },
  terminal: { backgroundColor: '#15180F', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  bolinhas: { flexDirection: 'row', gap: 6 },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  no: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, backgroundColor: '#000' },
});
