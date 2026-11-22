// Estilo "corrida" (ação): cortes secos, contagem 3-2-1, riscos de velocidade, palavras que
// batem com tremida, relógio correndo até 17:59 e uma barra de build enchendo.
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cena, cheio, Fecho, Ficha, Fundo, mono, Odometro, Palavras, prog, ruido, Surge, type PropsEstilo } from './base';

const ABRE = [0, 2300] as const;
const C1 = [2300, 7000] as const;
const C2 = [7000, 11500] as const;
const C3 = [11500, 16000] as const;
const C4 = [16000, 20500] as const;
const TIT = [20500, 27000] as const;

export function Corrida({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(50, Math.max(24, largura * 0.07)));
  const forte = [estilos.forte, { fontSize: g, lineHeight: Math.round(g * 1.05) }];
  const { frases } = roteiro;
  const vermelho = paleta.destaque;

  return (
    <>
      {/* 3, 2, 1 */}
      {(['3', '2', '1'] as const).map((n, i) => (
        <Cena key={n} t={t} janela={[i * 700, i === 2 ? ABRE[1] : (i + 1) * 700]} troca={0}>
          <View style={[cheio, estilos.centro]}>
            <Surge t={t} ini={i * 700} m={m} modo="bate" texto={n} estilo={[estilos.forte, { fontSize: g * 2.6, color: i === 2 ? vermelho : '#FFFFFF' }]} />
          </View>
          <Text style={[estilos.rotulo, { bottom: altura * 0.12 }]}>CINEON APRESENTA</Text>
        </Cena>
      ))}

      <Cena t={t} janela={C1} troca={0}>
        <Riscos t={t} largura={largura} altura={altura} cor={vermelho} m={m} intensidade={1} />
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.08 }]}>
          <Palavras t={t} ini={C1[0] + 300} passo={260} m={m} modo="bate" texto={frases[0].toUpperCase()} estilo={forte} />
        </View>
      </Cena>

      <Cena t={t} janela={C2} troca={0}>
        {/* enquadra a parte de baixo do pôster e desfoca de leve, pra o letreiro dele não brigar com o texto */}
        <Fundo t={t} janela={C2} m={m} uri={poster} cor={paleta.medio} zoom={[1.45, 1.25]} desloca={[-0.2, -0.14]} escurece={0.5} desfoque={5} />
        <View style={[estilos.faixaVermelha, { backgroundColor: vermelho, bottom: altura * 0.2, height: altura * 0.012 }]} />
        <View style={{ position: 'absolute', left: largura * 0.07, right: largura * 0.07, bottom: altura * 0.26 }}>
          <Palavras t={t} ini={C2[0] + 250} passo={200} m={m} modo="bate" texto={frases[1].toUpperCase()} estilo={[forte, { fontSize: g * 0.8 }]} alinhar="flex-start" />
        </View>
      </Cena>

      <Cena t={t} janela={C3} troca={0}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.04 }]}>
          <Text style={[mono, estilos.build, { fontSize: Math.max(11, g * 0.32) }]}>BUILD #4012 · MAIN</Text>
          <View style={estilos.linha}>
            <Odometro t={t} digitos={2} tamanho={g * 1.6} cor="#FFFFFF" valor={(v) => {
              'worklet';
              const p = Math.min(1, Math.max(0, (v - 11800) / 3800));
              return p * p * 99;
            }} />
            <Text style={[mono, { color: vermelho, fontSize: g * 0.9, fontWeight: '700' }]}>%</Text>
          </View>
          <Barra t={t} de={11800} ate={15600} largura={largura * 0.6} cor={vermelho} />
          <Palavras t={t} ini={C3[0] + 700} passo={420} m={m} modo="bate" texto={frases[2].toUpperCase()} estilo={[forte, { fontSize: g * 0.62 }]} />
        </View>
      </Cena>

      <Cena t={t} janela={C4} troca={0}>
        <Riscos t={t} largura={largura} altura={altura} cor={vermelho} m={m} intensidade={0.45} />
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.07 }]}>
          <Surge t={t} ini={C4[0] + 350} m={m} modo="bate" texto={frases[3].toUpperCase()} estilo={[forte, { fontSize: g * 1.05, textAlign: 'center' }]} />
        </View>
        <Clarao t={t} ini={C4[0]} />
      </Cena>

      {/* relógio correndo por cima das cenas 1 a 4 */}
      <Cena t={t} janela={[C1[0], C4[1]]} troca={0} fundo="transparent">
        <View style={[estilos.hud, { top: altura * 0.07, left: largura * 0.05 }]}>
          <View style={[estilos.ponto, { backgroundColor: vermelho }]} />
          <Text style={[mono, estilos.hudTexto, { fontSize: Math.max(12, g * 0.38) }]}>SEXTA 17:</Text>
          <Odometro t={t} digitos={2} tamanho={Math.max(12, g * 0.38)} cor="#FFFFFF" valor={(v) => {
            'worklet';
            return 20 + 39 * Math.min(1, Math.max(0, (v - 2300) / 18000));
          }} />
        </View>
      </Cena>

      <Cena t={t} janela={TIT} troca={0}>
        <Fundo t={t} janela={TIT} m={m} uri={poster} cor={paleta.medio} zoom={[1.15, 1.25]} escurece={0.66} desfoque={6} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.04, paddingHorizontal: largura * 0.06 }]}>
          <Surge t={t} ini={TIT[0] + 250} m={m} modo="bate" texto={filme.titulo.toUpperCase()} estilo={[forte, { fontSize: g * 1.1, textAlign: 'center' }]} />
          <Barra t={t} de={TIT[0] + 700} ate={TIT[0] + 1200} largura={largura * 0.3} cor={vermelho} grossa />
          <Aparece t={t} ini={TIT[0] + 1500}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.36)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={vermelho} fonte={{ fontStyle: 'italic', fontWeight: '900' }} />
    </>
  );
}

// riscos atravessando a tela da direita pra esquerda
function Riscos({ t, largura, altura, cor, m, intensidade }: { t: SharedValue<number>; largura: number; altura: number; cor: string; m: number; intensidade: number }) {
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => (
        <Risco key={i} i={i} t={t} largura={largura} altura={altura} cor={i % 3 === 0 ? cor : '#FFFFFF'} m={m} intensidade={intensidade} />
      ))}
    </>
  );
}

function Risco({ i, t, largura, altura, cor, m, intensidade }: { i: number; t: SharedValue<number>; largura: number; altura: number; cor: string; m: number; intensidade: number }) {
  const comprimento = (0.12 + 0.3 * ruido(i, 2)) * largura;
  const a = useAnimatedStyle(() => {
    const velocidade = 1.2 + 2.2 * ruido(i, 3);
    const volta = largura * 1.8;
    const x = largura * 1.2 - (((t.get() / 1000) * velocidade * largura + ruido(i, 4) * volta) % volta);
    return { transform: [{ translateX: m ? x : largura * ruido(i, 5) }] };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: ruido(i, 1) * altura, width: comprimento, height: 1 + Math.round(ruido(i, 6) * 3), backgroundColor: cor, opacity: (0.25 + 0.6 * ruido(i, 7)) * intensidade, borderRadius: 2 },
        a,
      ]}
    />
  );
}

function Barra({ t, de, ate, largura, cor, grossa }: { t: SharedValue<number>; de: number; ate: number; largura: number; cor: string; grossa?: boolean }) {
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: prog(t.get(), de, ate) }] }));
  const h = grossa ? 5 : 8;
  return (
    <View style={{ width: largura, height: h, borderRadius: h / 2, backgroundColor: grossa ? 'transparent' : 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
      <Animated.View style={[cheio, { backgroundColor: cor, transformOrigin: grossa ? 'center' : 'left' }, a]} />
    </View>
  );
}

function Clarao({ t, ini }: { t: SharedValue<number>; ini: number }) {
  const a = useAnimatedStyle(() => ({ opacity: 1 - prog(t.get(), ini, ini + 320) }));
  return <Animated.View style={[cheio, { backgroundColor: '#FFFFFF' }, a]} />;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  forte: { color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
  rotulo: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  build: { color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  faixaVermelha: { position: 'absolute', left: 0, width: '38%' },
  hud: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  hudTexto: { color: '#FFFFFF', fontWeight: '700' },
});
