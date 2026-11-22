// Estilo "oceano" (animação): a água sobe e enche a tela, bolhas subindo, linhas de log
// flutuando no fundo, um peixinho atravessando e palavras que quicam.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cartao, Cena, cheio, Fecho, Ficha, mono, Palavras, prog, ruido, suave, type PropsEstilo } from './base';

const ABRE = [0, 2800] as const;
const C1 = [2800, 8000] as const;
const C2 = [8000, 13000] as const;
const C3 = [13000, 18000] as const;
const C4 = [18000, 22000] as const;
const TIT = [22000, 27000] as const;

const LOGS = [
  'ERROR 500 at /api/pedidos',
  'WARN  retry 3/3 timeout',
  'TypeError: undefined is not a function',
  'at processa (fila.ts:42)',
  'ERROR connection reset by peer',
  'INFO  deploy v2.3.1 concluído',
  'at async Promise.all (index 7)',
  'WARN  memória em 97%',
];

export function Oceano({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(48, Math.max(24, largura * 0.066)));
  const amarelo = paleta.destaque;
  const redondo = [estilos.redondo, { fontSize: g, lineHeight: Math.round(g * 1.15) }];
  const { frases } = roteiro;

  return (
    <>
      <Cena t={t} janela={ABRE} fundo={paleta.fundo}>
        <Agua t={t} altura={altura} cor={paleta.medio} />
        <Bolhas t={t} largura={largura} altura={altura} m={m} quantas={8} />
        <View style={[cheio, estilos.centro]}>
          <Balanca t={t} m={m}>
            <Aparece t={t} ini={1300}>
              <Text style={estilos.rotulo}>CINEON APRESENTA</Text>
            </Aparece>
          </Balanca>
        </View>
      </Cena>

      <Cena t={t} janela={C1} fundo={paleta.medio}>
        <Logs t={t} largura={largura} altura={altura} m={m} />
        <Bolhas t={t} largura={largura} altura={altura} m={m} quantas={12} />
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.08 }]}>
          <Balanca t={t} m={m}>
            <Palavras t={t} ini={C1[0] + 400} passo={240} m={m} modo="quica" texto={frases[0]} estilo={[redondo, { color: amarelo }]} />
          </Balanca>
        </View>
      </Cena>

      <Cena t={t} janela={C2} fundo={paleta.medio}>
        <Logs t={t} largura={largura} altura={altura} m={m} />
        <Peixe t={t} janela={C2} largura={largura} altura={altura} m={m} cor={amarelo} />
        <Bolhas t={t} largura={largura} altura={altura} m={m} quantas={10} />
        <View style={[cheio, { justifyContent: 'flex-start', alignItems: 'center', paddingTop: altura * 0.16, paddingHorizontal: largura * 0.08 }]}>
          <Balanca t={t} m={m}>
            <Palavras t={t} ini={C2[0] + 300} passo={200} m={m} modo="quica" texto={frases[1]} estilo={redondo} />
          </Balanca>
        </View>
      </Cena>

      <Cena t={t} janela={C3} fundo={paleta.fundo}>
        <Bolhas t={t} largura={largura} altura={altura} m={m} quantas={14} />
        <View style={[cheio, estilos.linhaCena, { paddingHorizontal: largura * 0.08, gap: largura * 0.06 }]}>
          <Boia t={t} m={m}>
            <Cartao uri={poster} cor={paleta.medio} altura={altura * 0.7} estilo={{ transform: [{ rotate: '-4deg' }] }} />
          </Boia>
          <View style={{ flex: 1 }}>
            <Palavras t={t} ini={C3[0] + 500} passo={220} m={m} modo="quica" texto={frases[2]} estilo={[redondo, { fontSize: g * 0.85 }]} alinhar="flex-start" />
          </View>
        </View>
      </Cena>

      <Cena t={t} janela={C4} fundo="#04121B">
        <Luzinha t={t} janela={C4} largura={largura} altura={altura} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.06, paddingHorizontal: largura * 0.1 }]}>
          <Aparece t={t} ini={C4[0] + 500}>
            <Text style={[mono, { color: amarelo, fontSize: g * 0.8, fontWeight: '700' }]}>{'{ bug }'}</Text>
          </Aparece>
          <Palavras t={t} ini={C4[0] + 900} passo={180} m={m} modo="quica" texto={frases[3]} estilo={[redondo, { fontSize: g * 0.7 }]} />
        </View>
      </Cena>

      <Cena t={t} janela={TIT} fundo={paleta.medio}>
        <Bolhas t={t} largura={largura} altura={altura} m={m} quantas={12} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.05, paddingHorizontal: largura * 0.06 }]}>
          <Balanca t={t} m={m}>
            <Palavras t={t} ini={TIT[0] + 300} passo={260} m={m} modo="quica" texto={filme.titulo} estilo={[redondo, { color: amarelo, fontSize: g * 1.25, lineHeight: g * 1.4 }]} />
          </Balanca>
          <Aparece t={t} ini={TIT[0] + 1600}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.36)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={amarelo} fundo={paleta.fundo} />
    </>
  );
}

// a água subindo do fundo até cobrir tudo
function Agua({ t, altura, cor }: { t: SharedValue<number>; altura: number; cor: string }) {
  const a = useAnimatedStyle(() => ({ height: suave(prog(t.get(), 100, 1500)) * altura }));
  return <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: cor }, a]} />;
}

function Bolhas({ t, largura, altura, m, quantas }: { t: SharedValue<number>; largura: number; altura: number; m: number; quantas: number }) {
  return (
    <>
      {Array.from({ length: quantas }, (_, i) => (
        <Bolha key={i} i={i} t={t} largura={largura} altura={altura} m={m} />
      ))}
    </>
  );
}

function Bolha({ i, t, largura, altura, m }: { i: number; t: SharedValue<number>; largura: number; altura: number; m: number }) {
  const r = 4 + ruido(i, 1) * 12;
  const a = useAnimatedStyle(() => {
    const v = t.get() / 1000;
    const volta = altura + 40;
    const y = altura + 20 - ((v * (40 + 50 * ruido(i, 2)) + ruido(i, 3) * volta) % volta);
    const x = ruido(i, 4) * largura + Math.sin(v * 2 + i) * 8;
    return { transform: [{ translateX: x }, { translateY: m ? y : ruido(i, 5) * altura }] };
  });
  return <Animated.View style={[estilos.bolha, { width: r * 2, height: r * 2, borderRadius: r }, a]} />;
}

function Logs({ t, largura, altura, m }: { t: SharedValue<number>; largura: number; altura: number; m: number }) {
  return (
    <>
      {LOGS.map((l, i) => (
        <Log key={i} i={i} texto={l} t={t} largura={largura} altura={altura} m={m} />
      ))}
    </>
  );
}

function Log({ i, texto, t, largura, altura, m }: { i: number; texto: string; t: SharedValue<number>; largura: number; altura: number; m: number }) {
  const a = useAnimatedStyle(() => {
    const v = t.get() / 1000;
    const volta = altura + 30;
    const y = altura - ((v * 18 + i * (volta / LOGS.length)) % volta);
    return { transform: [{ translateY: m ? y : (i / LOGS.length) * altura }, { translateX: Math.sin(v + i) * 6 * m }] };
  });
  return (
    <Animated.Text style={[mono, estilos.log, { left: (0.04 + 0.5 * ruido(i, 8)) * largura, fontSize: Math.max(9, largura * 0.018) }, a]} numberOfLines={1}>
      {texto}
    </Animated.Text>
  );
}

// peixinho atravessando da esquerda pra direita, subindo e descendo
function Peixe({ t, janela, largura, altura, m, cor }: { t: SharedValue<number>; janela: readonly [number, number]; largura: number; altura: number; m: number; cor: string }) {
  const [ini, fim] = janela;
  const tam = Math.max(26, largura * 0.07);
  const a = useAnimatedStyle(() => {
    const p = prog(t.get(), ini, fim);
    const x = -tam * 2 + p * (largura + tam * 4);
    const y = altura * 0.62 + Math.sin(t.get() / 260) * altura * 0.04;
    return { transform: [{ translateX: m ? x : largura * 0.45 }, { translateY: y }, { rotate: `${Math.cos(t.get() / 260) * 8 * m}deg` }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, flexDirection: 'row', alignItems: 'center' }, a]}>
      <View style={{ width: 0, height: 0, borderTopWidth: tam * 0.32, borderBottomWidth: tam * 0.32, borderRightWidth: tam * 0.4, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#FF8A3D', marginRight: -2 }} />
      <View style={{ width: tam, height: tam * 0.62, borderRadius: tam * 0.32, backgroundColor: '#FF8A3D', justifyContent: 'center', alignItems: 'flex-end', paddingRight: tam * 0.18 }}>
        <View style={{ width: tam * 0.14, height: tam * 0.14, borderRadius: tam * 0.07, backgroundColor: '#1A1A1A' }} />
      </View>
      <View style={{ position: 'absolute', left: tam * 0.62, width: tam * 0.08, height: tam * 0.62, backgroundColor: cor, opacity: 0.85 }} />
    </Animated.View>
  );
}

// círculo de luz no escuro, como uma lanterna procurando
function Luzinha({ t, janela, largura, altura }: { t: SharedValue<number>; janela: readonly [number, number]; largura: number; altura: number }) {
  const [ini] = janela;
  const d = altura * 0.9;
  const a = useAnimatedStyle(() => {
    const p = suave(prog(t.get(), ini, ini + 1200));
    return { opacity: 0.09 * p, transform: [{ scale: 0.6 + 0.4 * p }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: (largura - d) / 2, top: (altura - d) / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: '#FFFFFF' }, a]} />;
}

// sobe e desce devagar, boiando
function Balanca({ t, m, children }: { t: SharedValue<number>; m: number; children: ReactNode }) {
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(t.get() / 600) * 5 * m }] }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

function Boia({ t, m, children }: { t: SharedValue<number>; m: number; children: ReactNode }) {
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(t.get() / 700) * 8 * m }, { rotate: `${Math.sin(t.get() / 900) * 2 * m}deg` }] }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  linhaCena: { flexDirection: 'row', alignItems: 'center' },
  redondo: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  rotulo: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  bolha: { position: 'absolute', left: 0, top: 0, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.08)' },
  log: { position: 'absolute', top: 0, color: 'rgba(255,255,255,0.16)' },
});
