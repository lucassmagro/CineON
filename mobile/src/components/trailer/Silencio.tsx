// Estilo "silêncio" (suspense): chiado, relógio com glitch, um rack de LEDs que apaga
// um por um, o ping virando timeout e o pulso ficando reto. No fim, linhas de varredura.
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cena, cheio, Fecho, Ficha, Fundo, mono, ruido, Surge, type PropsEstilo } from './base';

const ABRE = [0, 3000] as const;
const C1 = [3000, 8000] as const;
const C2 = [8000, 13000] as const;
const C3 = [13000, 18000] as const;
const C4 = [18000, 21500] as const;
const TIT = [21500, 27000] as const;

const VERDE = '#30D158';
const ALERTA = '#FF453A';

export function Silencio({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(46, Math.max(22, largura * 0.062)));
  const azul = paleta.destaque;
  const fino = [estilos.fino, { fontSize: g * 0.78, lineHeight: Math.round(g * 1.05) }];
  const { frases } = roteiro;
  const tamPing = Math.max(9, Math.min(g * 0.36, largura / 46));

  return (
    <>
      <Cena t={t} janela={ABRE} troca={0}>
        <Chiado t={t} altura={altura} m={m} />
        <View style={[cheio, estilos.centro]}>
          <Surge t={t} ini={900} m={m} modo="pisca" texto="CINEON APRESENTA" estilo={estilos.rotulo} />
        </View>
      </Cena>

      <Cena t={t} janela={C1} troca={0}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.05 }]}>
          <Glitch t={t} m={m} texto={frases[0]} tamanho={frases[0].length <= 6 ? g * 2.6 : g * 1.1} />
          <Aparece t={t} ini={C1[0] + 1600} dur={900}>
            <Text style={[mono, { color: 'rgba(255,255,255,0.45)', fontSize: Math.max(10, g * 0.32), letterSpacing: 2 }]}>PLANTÃO · DATACENTER · SALA 2</Text>
          </Aparece>
        </View>
      </Cena>

      <Cena t={t} janela={C2} troca={0} fundo="#060B12">
        <View style={[cheio, estilos.centro, { gap: altura * 0.08, paddingHorizontal: largura * 0.08 }]}>
          <Rack t={t} largura={Math.min(largura * 0.62, altura * 1.3)} apagaEm={C2[0] + 2200} azul={azul} />
          <Surge t={t} ini={C2[0] + 900} m={m} modo="pisca" texto={frases[1]} estilo={[fino, { textAlign: 'center' }]} />
        </View>
      </Cena>

      <Cena t={t} janela={C3} troca={0}>
        <View style={[cheio, { paddingHorizontal: largura * 0.07, paddingTop: altura * 0.1, gap: altura * 0.018 }]}>
          {[
            ['64 bytes from 10.0.0.12: icmp_seq=1 time=0.41 ms', 'rgba(255,255,255,0.6)'],
            ['64 bytes from 10.0.0.12: icmp_seq=2 time=0.39 ms', 'rgba(255,255,255,0.6)'],
            ['Request timeout for icmp_seq 3', ALERTA],
            ['Request timeout for icmp_seq 4', ALERTA],
            ['Request timeout for icmp_seq 5', ALERTA],
          ].map(([linha, cor], i) => (
            <Aparece key={i} t={t} ini={C3[0] + 200 + i * 520} dur={80}>
              <Text style={[mono, { color: cor, fontSize: tamPing }]} numberOfLines={1}>
                {linha}
              </Text>
            </Aparece>
          ))}
        </View>
        <Pulso t={t} largura={largura * 0.86} altura={altura * 0.16} reta={C3[0] + 1700} estilo={{ position: 'absolute', left: largura * 0.07, top: altura * 0.56 }} />
        <View style={{ position: 'absolute', left: largura * 0.07, right: largura * 0.07, bottom: altura * 0.08 }}>
          <Surge t={t} ini={C3[0] + 2600} m={m} modo="pisca" texto={frases[2]} estilo={fino} />
        </View>
      </Cena>

      <Cena t={t} janela={C4} troca={0}>
        <Relance t={t} ini={C4[0] + 1500} uri={poster} cor={paleta.medio} />
        <View style={[cheio, estilos.centro]}>
          <Surge t={t} ini={C4[0] + 400} m={m} modo="pisca" texto={frases[3]} estilo={[estilos.fino, { fontSize: g * 1.25, fontWeight: '600' }]} />
        </View>
        <Gravando t={t} estilo={{ top: altura * 0.08, right: largura * 0.05 }} />
      </Cena>

      <Cena t={t} janela={TIT} troca={260}>
        <Fundo t={t} janela={TIT} m={m} uri={poster} cor={paleta.medio} zoom={[1.2, 1.3]} escurece={0.7} desfoque={4} tinta={paleta.fundo} />
        <Varredura t={t} altura={altura} m={m} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.05, paddingHorizontal: largura * 0.06 }]}>
          <Surge t={t} ini={TIT[0] + 400} m={m} modo="pisca" texto={filme.titulo.toUpperCase()} estilo={[estilos.titulo, { fontSize: g * 0.95, letterSpacing: g * 0.12, color: '#E6F1FF' }]} />
          <Aparece t={t} ini={TIT[0] + 1900}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.36)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={azul} fonte={{ fontWeight: '300', letterSpacing: 4 }} />
    </>
  );
}

// faixas horizontais piscando, como tela sem sinal
function Chiado({ t, altura, m }: { t: SharedValue<number>; altura: number; m: number }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <Faixa key={i} i={i} t={t} altura={altura} m={m} />
      ))}
    </>
  );
}

function Faixa({ i, t, altura, m }: { i: number; t: SharedValue<number>; altura: number; m: number }) {
  const a = useAnimatedStyle(() => {
    const quadro = Math.floor(t.get() / 70);
    return { opacity: m ? ruido(quadro, i) * 0.18 : 0.05, transform: [{ translateY: ruido(quadro, i + 40) * altura }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 2 + (i % 4) * 3, backgroundColor: '#FFFFFF' }, a]} />;
}

// três cópias do texto: branca no meio, ciano e vermelha deslocando em rajadas
function Glitch({ t, m, texto, tamanho }: { t: SharedValue<number>; m: number; texto: string; tamanho: number }) {
  const deslize = (k: number) => {
    'worklet';
    const quadro = Math.floor(t.get() / 90);
    return ruido(quadro, 7) > 0.68 ? (ruido(quadro, k) - 0.5) * tamanho * 0.12 * m : 0;
  };
  const ciano = useAnimatedStyle(() => ({ transform: [{ translateX: deslize(1) }], opacity: 0.8 }));
  const verm = useAnimatedStyle(() => ({ transform: [{ translateX: -deslize(2) }], opacity: 0.8 }));
  const meio = useAnimatedStyle(() => ({ transform: [{ translateX: deslize(3) * 0.3 }], opacity: ruido(Math.floor(t.get() / 90), 9) > 0.92 && m ? 0.3 : 1 }));
  const fonte = [mono, { fontSize: tamanho, fontWeight: '700' as const, letterSpacing: tamanho * 0.04 }];
  return (
    <View>
      <Animated.Text style={[fonte, { color: '#00E5FF', position: 'absolute' }, ciano]}>{texto}</Animated.Text>
      <Animated.Text style={[fonte, { color: ALERTA, position: 'absolute' }, verm]}>{texto}</Animated.Text>
      <Animated.Text style={[fonte, { color: '#FFFFFF' }, meio]}>{texto}</Animated.Text>
    </View>
  );
}

// grade de LEDs piscando; a partir de "apagaEm" vão apagando em ordem embaralhada
function Rack({ t, largura, apagaEm, azul }: { t: SharedValue<number>; largura: number; apagaEm: number; azul: string }) {
  const colunas = 10;
  const linhas = 4;
  const gap = largura * 0.025;
  const lado = (largura - gap * (colunas - 1)) / colunas;
  return (
    <View style={[estilos.rack, { width: largura + 24, gap }]}>
      {Array.from({ length: linhas }, (_, l) => (
        <View key={l} style={{ flexDirection: 'row', gap }}>
          {Array.from({ length: colunas }, (_, c) => {
            const i = l * colunas + c;
            return <Led key={c} i={i} t={t} lado={lado} apaga={apagaEm + ruido(i, 11) * 1800} cor={i % 7 === 0 ? azul : VERDE} />;
          })}
        </View>
      ))}
    </View>
  );
}

function Led({ i, t, lado, apaga, cor }: { i: number; t: SharedValue<number>; lado: number; apaga: number; cor: string }) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    if (v >= apaga) return { opacity: 0.12 };
    return { opacity: ruido(Math.floor(v / 140), i) > 0.3 ? 1 : 0.35 };
  });
  return <Animated.View style={[{ width: lado, height: lado * 0.34, borderRadius: 2, backgroundColor: cor }, a]} />;
}

// barrinhas que formam um pulso passando; depois de "reta" fica tudo achatado
function Pulso({ t, largura, altura, reta, estilo }: { t: SharedValue<number>; largura: number; altura: number; reta: number; estilo?: object }) {
  const n = 48;
  const larg = largura / n;
  // linha contínua por baixo: o pulso sai dela e, depois do "reta", só ela sobra
  const base = useAnimatedStyle(() => ({ backgroundColor: t.get() < reta ? VERDE : ALERTA }));
  return (
    <View style={[{ width: largura, height: altura, flexDirection: 'row', alignItems: 'center' }, estilo]}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, height: 2, top: altura / 2 - 1, opacity: 0.7 }, base]} />
      {Array.from({ length: n }, (_, i) => (
        <Batida key={i} i={i} n={n} t={t} altura={altura} reta={reta} largura={larg} />
      ))}
    </View>
  );
}

function Batida({ i, n, t, altura, reta, largura }: { i: number; n: number; t: SharedValue<number>; altura: number; reta: number; largura: number }) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    const pos = ((v / 900) % 1) * n;
    const dist = Math.abs(i - pos);
    const pico = v < reta && dist < 2.5 ? (1 - dist / 2.5) * (i % 2 === 0 ? 1 : 0.55) : 0;
    return { height: Math.max(2, pico * altura), backgroundColor: v < reta ? VERDE : ALERTA };
  });
  return <Animated.View style={[{ width: Math.max(1, largura - 2), marginRight: 2, borderRadius: 1 }, a]} />;
}

// o pôster aparece por um instante, quase subliminar
function Relance({ t, ini, uri, cor }: { t: SharedValue<number>; ini: number; uri: string | null; cor: string }) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    return { opacity: v >= ini && v < ini + 140 ? 0.55 : 0 };
  });
  return (
    <Animated.View style={[cheio, { backgroundColor: cor }, a]}>
      {uri ? <Animated.Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
    </Animated.View>
  );
}

function Gravando({ t, estilo }: { t: SharedValue<number>; estilo?: object }) {
  const a = useAnimatedStyle(() => ({ opacity: Math.floor(t.get() / 500) % 2 === 0 ? 1 : 0.2 }));
  return (
    <Animated.View style={[{ position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6 }, estilo, a]}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: ALERTA }} />
      <Text style={[mono, { color: ALERTA, fontSize: 11, fontWeight: '700' }]}>REC</Text>
    </Animated.View>
  );
}

// linhas finas fixas e uma faixa de luz descendo
function Varredura({ t, altura, m }: { t: SharedValue<number>; altura: number; m: number }) {
  const faixa = useAnimatedStyle(() => ({ transform: [{ translateY: m ? ((t.get() / 2400) % 1) * (altura + 60) - 60 : -100 }] }));
  return (
    <>
      <View style={[cheio, { justifyContent: 'space-between' }]}>
        {Array.from({ length: Math.ceil(altura / 5) }, (_, i) => (
          <View key={i} style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        ))}
      </View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 60, backgroundColor: 'rgba(170,210,255,0.06)' }, faixa]} />
    </>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  rotulo: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', letterSpacing: 4 },
  fino: { color: '#DCE7F5', fontWeight: '300', letterSpacing: 0.2 },
  titulo: { fontWeight: '300', textAlign: 'center' },
  rack: { padding: 12, borderRadius: 8, backgroundColor: '#0D141E', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
});
