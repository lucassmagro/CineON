// Estilo "tempo" (ficção científica): anéis se abrindo, o ano num painel, um relógio com os
// ponteiros girando pra trás, o odômetro rolando até o ano de destino e um salto de luz.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Aparece, Cena, cheio, Fecho, Ficha, Fundo, mono, Odometro, prog, ruido, Surge, suave, type PropsEstilo } from './base';

const ABRE = [0, 2600] as const;
const C1 = [2600, 8000] as const;
const C2 = [8000, 13000] as const;
const C3 = [13000, 18000] as const;
const C4 = [18000, 21500] as const;
const TIT = [21500, 27000] as const;

export function Tempo({ t, m, largura, altura, filme, roteiro, paleta, poster }: PropsEstilo) {
  const g = Math.round(Math.min(46, Math.max(22, largura * 0.062)));
  const laranja = paleta.destaque;
  const [de, para] = roteiro.anos ?? [2026, 1985];
  const { frases } = roteiro;
  const texto = [estilos.texto, { fontSize: g * 0.78, lineHeight: Math.round(g * 1.02) }];
  const painel = Math.max(26, Math.min(g * 1.5, largura * 0.09));

  return (
    <>
      <Cena t={t} janela={ABRE}>
        <Aneis t={t} cor={laranja} tamanho={altura * 0.9} largura={largura} altura={altura} m={m} />
        <View style={[cheio, estilos.centro]}>
          <Aparece t={t} ini={900}>
            <Text style={estilos.rotulo}>CINEON APRESENTA</Text>
          </Aparece>
        </View>
      </Cena>

      <Cena t={t} janela={C1} fundo={paleta.fundo}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.06, paddingHorizontal: largura * 0.08 }]}>
          <Text style={[mono, estilos.legenda, { color: laranja }]}>ANO ATUAL</Text>
          <Odometro t={t} digitos={4} tamanho={painel} cor={laranja} fundo="#0A1016" valor={() => {
            'worklet';
            return de;
          }} />
          <Surge t={t} ini={C1[0] + 900} m={m} texto={frases[0]} estilo={[texto, { textAlign: 'center' }]} />
          <Piscando t={t}>
            <Text style={[mono, estilos.legenda, { color: '#FF453A' }]}>ÚLTIMO BACKUP: --/--/----</Text>
          </Piscando>
        </View>
      </Cena>

      <Cena t={t} janela={C2} fundo={paleta.fundo}>
        <View style={[cheio, estilos.linha, { paddingHorizontal: largura * 0.08, gap: largura * 0.06 }]}>
          <Relogio t={t} ini={C2[0]} fim={C2[1]} raio={altura * 0.32} cor={laranja} m={m} />
          <View style={{ flex: 1 }}>
            <Surge t={t} ini={C2[0] + 700} m={m} texto={frases[1]} estilo={texto} />
          </View>
        </View>
      </Cena>

      <Cena t={t} janela={C3} fundo={paleta.fundo}>
        <View style={[cheio, estilos.centro, { gap: altura * 0.06, paddingHorizontal: largura * 0.08 }]}>
          <Text style={[mono, estilos.legenda, { color: laranja }]}>DESTINO</Text>
          <Odometro t={t} digitos={4} tamanho={painel * 1.15} cor={laranja} fundo="#0A1016" valor={(v) => {
            'worklet';
            const p = Math.min(1, Math.max(0, (v - 13400) / 3200));
            return de + (para - de) * (1 - Math.pow(1 - p, 3));
          }} />
          <Surge t={t} ini={C3[0] + 3700} m={m} texto={frases[2]} estilo={[texto, { textAlign: 'center', fontSize: g * 0.62 }]} />
        </View>
      </Cena>

      <Cena t={t} janela={C4}>
        <Salto t={t} ini={C4[0]} largura={largura} altura={altura} cor={laranja} m={m} />
        <View style={[cheio, estilos.centro, { paddingHorizontal: largura * 0.08 }]}>
          <Surge t={t} ini={C4[0] + 2200} m={m} texto={frases[3]} estilo={[texto, { textAlign: 'center', fontSize: g, fontWeight: '800' }]} />
        </View>
        <Clarao t={t} ini={C4[0] + 1700} />
      </Cena>

      <Cena t={t} janela={TIT}>
        <Fundo t={t} janela={TIT} m={m} uri={poster} cor={paleta.medio} zoom={[1.35, 1.2]} escurece={0.58} desfoque={10} tinta={paleta.fundo} />
        <View style={[cheio, estilos.centro, { gap: altura * 0.04, paddingHorizontal: largura * 0.06 }]}>
          <Surge t={t} ini={TIT[0] + 300} m={m} modo="quica" texto={filme.titulo} estilo={[estilos.titulo, { fontSize: g * 1.25, lineHeight: g * 1.35 }]} />
          <Aparece t={t} ini={TIT[0] + 1200}>
            <Text style={[mono, estilos.legenda, { color: laranja }]}>
              {de} → {para} · {Math.abs(de - para)} ANOS DE VOLTA
            </Text>
          </Aparece>
          <Aparece t={t} ini={TIT[0] + 1900}>
            <Ficha filme={filme} tamanho={Math.max(12, g * 0.36)} />
          </Aparece>
        </View>
      </Cena>

      <Fecho t={t} largura={largura} cor={laranja} fundo={paleta.fundo} />
    </>
  );
}

// dois anéis finos se abrindo a partir do centro
function Aneis({ t, cor, tamanho, largura, altura, m }: { t: SharedValue<number>; cor: string; tamanho: number; largura: number; altura: number; m: number }) {
  return (
    <>
      {[0, 700].map((atraso) => (
        <Anel key={atraso} t={t} atraso={atraso} cor={cor} tamanho={tamanho} largura={largura} altura={altura} m={m} />
      ))}
    </>
  );
}

function Anel({ t, atraso, cor, tamanho, largura, altura, m }: { t: SharedValue<number>; atraso: number; cor: string; tamanho: number; largura: number; altura: number; m: number }) {
  const a = useAnimatedStyle(() => {
    const p = prog(t.get(), 200 + atraso, 2200 + atraso);
    return { opacity: (1 - p) * (p > 0 ? 1 : 0), transform: [{ scale: m ? 0.15 + 1.2 * suave(p) : 1 }] };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: (largura - tamanho) / 2, top: (altura - tamanho) / 2, width: tamanho, height: tamanho, borderRadius: tamanho / 2, borderWidth: 2, borderColor: cor }, a]}
    />
  );
}

// relógio com os ponteiros girando pra trás, cada vez mais rápido
function Relogio({ t, ini, fim, raio, cor, m }: { t: SharedValue<number>; ini: number; fim: number; raio: number; cor: string; m: number }) {
  const lado = raio * 2;
  const minutos = useAnimatedStyle(() => {
    const p = prog(t.get(), ini, fim);
    return { transform: [{ rotate: `${m ? -p * p * 360 * 14 : 0}deg` }] };
  });
  const horas = useAnimatedStyle(() => {
    const p = prog(t.get(), ini, fim);
    return { transform: [{ rotate: `${m ? 120 - p * p * 360 * 1.6 : 120}deg` }] };
  });
  return (
    <View style={{ width: lado, height: lado, borderRadius: raio, borderWidth: 2, borderColor: 'rgba(255,255,255,0.75)' }}>
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={[cheio, { alignItems: 'center', transform: [{ rotate: `${i * 30}deg` }] }]}>
          <View style={{ marginTop: raio * 0.08, width: i % 3 === 0 ? 3 : 2, height: raio * (i % 3 === 0 ? 0.16 : 0.09), backgroundColor: i % 3 === 0 ? cor : 'rgba(255,255,255,0.6)' }} />
        </View>
      ))}
      <Animated.View style={[cheio, { alignItems: 'center' }, horas]}>
        <View style={{ marginTop: raio * 0.42, width: 4, height: raio * 0.6, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
      </Animated.View>
      <Animated.View style={[cheio, { alignItems: 'center' }, minutos]}>
        <View style={{ marginTop: raio * 0.16, width: 2.5, height: raio * 0.86, borderRadius: 2, backgroundColor: cor }} />
      </Animated.View>
      <View style={[cheio, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
      </View>
    </View>
  );
}

// raios saindo do centro, como um salto no tempo
function Salto({ t, ini, largura, altura, cor, m }: { t: SharedValue<number>; ini: number; largura: number; altura: number; cor: string; m: number }) {
  return (
    <View style={[cheio, { alignItems: 'center', justifyContent: 'center' }]}>
      {Array.from({ length: 30 }, (_, i) => (
        <Raio key={i} i={i} t={t} ini={ini} alcance={Math.max(largura, altura) * 0.7} cor={i % 3 === 0 ? cor : '#FFFFFF'} m={m} />
      ))}
    </View>
  );
}

function Raio({ i, t, ini, alcance, cor, m }: { i: number; t: SharedValue<number>; ini: number; alcance: number; cor: string; m: number }) {
  const angulo = i * 12 + ruido(i, 3) * 8;
  const a = useAnimatedStyle(() => {
    const p = prog(t.get(), ini + ruido(i, 1) * 400, ini + 1700);
    const x = (0.05 + 0.95 * p * p) * alcance;
    return { opacity: p > 0 ? 0.3 + 0.7 * p : 0, transform: [{ rotate: `${angulo}deg` }, { translateX: m ? x : alcance * 0.4 }, { scaleX: 0.2 + 2.4 * p }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: 40, height: 2, borderRadius: 1, backgroundColor: cor }, a]} />;
}

function Clarao({ t, ini }: { t: SharedValue<number>; ini: number }) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    return { opacity: prog(v, ini, ini + 250) * (1 - prog(v, ini + 350, ini + 900)) };
  });
  return <Animated.View style={[cheio, { backgroundColor: '#FFFFFF' }, a]} />;
}

function Piscando({ t, children }: { t: SharedValue<number>; children: ReactNode }) {
  const a = useAnimatedStyle(() => ({ opacity: Math.floor(t.get() / 450) % 2 === 0 ? 1 : 0.25 }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center' },
  rotulo: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', letterSpacing: 3.5 },
  legenda: { fontSize: 12, fontWeight: '700', letterSpacing: 2.5 },
  texto: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.4 },
  titulo: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
});
