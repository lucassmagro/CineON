// Peças comuns dos trailers: a janela de cada cena, o fundo com o pôster, texto que entra
// de jeitos diferentes, digitação de terminal, odômetro de dígitos e o fecho "Em cartaz".
// Tudo lê o mesmo relógio (t, em ms); m = 0 quando a pessoa pediu pra reduzir movimento.
import { useState, type ReactNode } from 'react';
import { Image, Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { SeloClassificacao } from '@/components/SeloClassificacao';
import type { Filme } from '@/models/tipos';
import type { PaletaFilme } from '@/ui/coresPoster';
import type { Roteiro } from '@/ui/roteirosTrailer';
import { fonteCodigo } from '@/ui/tema';
import { duracao } from '@/utils/formatar';

export const TOTAL = 30000;
export const FECHO = 27000;
export const cheio = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
export const serifa: TextStyle = { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }) };
export const mono: TextStyle = fonteCodigo;

export type FilmeTrailer = Pick<Filme, 'id' | 'titulo' | 'sinopse' | 'genero' | 'duracaoMin' | 'classificacao' | 'posterUrl'>;

export type PropsEstilo = {
  t: SharedValue<number>;
  m: number;
  largura: number;
  altura: number;
  filme: FilmeTrailer;
  roteiro: Roteiro;
  paleta: PaletaFilme;
  poster: string | null;
};

// de 0 a 1 entre a e b
export function prog(v: number, a: number, b: number): number {
  'worklet';
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}

export function suave(p: number): number {
  'worklet';
  return 1 - Math.pow(1 - p, 3);
}

// passa um pouco do ponto e volta, como uma mola
export function mola(p: number): number {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

// número "aleatório" que é sempre o mesmo pra os mesmos i e s
export function ruido(i: number, s: number): number {
  'worklet';
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// a cena aparece e some esmaecendo nas bordas da janela; troca 0 é corte seco
export function Cena({
  t,
  janela,
  troca = 320,
  fundo = '#000',
  ultima,
  children,
}: {
  t: SharedValue<number>;
  janela: readonly [number, number];
  troca?: number;
  fundo?: string;
  ultima?: boolean;
  children?: ReactNode;
}) {
  const [ini, fim] = janela;
  const a = useAnimatedStyle(() => {
    const v = t.get();
    const entra = ini === 0 ? prog(v, 0, 400) : troca === 0 ? (v >= ini ? 1 : 0) : prog(v, ini - troca, ini + troca);
    const sai = ultima ? 1 : troca === 0 ? (v < fim ? 1 : 0) : 1 - prog(v, fim - troca, fim + troca);
    return { opacity: Math.min(entra, sai) };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fundo, overflow: 'hidden' }, a]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

// pôster (ou a cor do filme) com zoom e deslize lentos e uma camada escura por cima
export function Fundo({
  t,
  janela,
  m,
  uri,
  cor,
  zoom = [1.1, 1.2],
  lado = [0, 0],
  desloca = [0, 0],
  escurece = 0.5,
  desfoque = 0,
  tinta,
}: {
  t: SharedValue<number>;
  janela: readonly [number, number];
  m: number;
  uri: string | null;
  cor: string;
  zoom?: [number, number];
  lado?: [number, number];
  desloca?: [number, number];
  escurece?: number;
  desfoque?: number;
  /** cor sólida por cima, no lugar do preto */
  tinta?: string;
}) {
  const [ini, fim] = janela;
  const [tam, setTam] = useState({ w: 360, h: 200 });
  const a = useAnimatedStyle(() => {
    const p = prog(t.get(), ini, fim);
    return {
      transform: [
        { translateX: (lado[0] + (lado[1] - lado[0]) * p) * tam.w * m },
        { translateY: (desloca[0] + (desloca[1] - desloca[0]) * p) * tam.h * m },
        { scale: zoom[0] + (zoom[1] - zoom[0]) * p * m },
      ],
    };
  });
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cor }, a]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={desfoque} accessibilityIgnoresInvertColors /> : null}
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tinta ?? '#000', opacity: escurece }]} />
    </View>
  );
}

// o pôster em pé, num cartão
export function Cartao({ uri, cor, altura, estilo }: { uri: string | null; cor: string; altura: number; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[base.cartao, { height: altura, width: (altura * 2) / 3, backgroundColor: cor }, estilo]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
    </View>
  );
}

export type Modo = 'sobe' | 'bate' | 'pisca' | 'quica' | 'lento';

// texto que entra num instante "ini": subindo, batendo com tremida, piscando, quicando ou bem devagar
export function Surge({
  t,
  ini,
  m,
  modo = 'sobe',
  texto,
  estilo,
  caixa,
}: {
  t: SharedValue<number>;
  ini: number;
  m: number;
  modo?: Modo;
  texto: string;
  estilo: StyleProp<TextStyle>;
  caixa?: StyleProp<ViewStyle>;
}) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    if (modo === 'bate') {
      const p = prog(v, ini, ini + 200);
      const tremida = v > ini + 200 ? Math.sin((v - ini) / 18) * 6 * (1 - prog(v, ini + 200, ini + 700)) : 0;
      return { opacity: p > 0 ? 1 : 0, transform: [{ scale: 1 + (1 - p) * 0.6 * m }, { translateX: tremida * m }] };
    }
    if (modo === 'pisca') {
      const p = prog(v, ini, ini + 900);
      const aceso = p >= 1 ? 1 : p > 0 ? (ruido(Math.floor(v / 60), ini) > 0.45 + 0.4 * (1 - p) ? 1 : 0.1) : 0;
      return { opacity: m ? aceso : p > 0 ? 1 : 0 };
    }
    if (modo === 'quica') {
      const p = prog(v, ini, ini + 650);
      return { opacity: Math.min(1, p * 3), transform: [{ scale: 0.4 + 0.6 * (m ? mola(p) : 1) }, { translateY: (1 - suave(p)) * 14 * m }] };
    }
    if (modo === 'lento') {
      const p = prog(v, ini, ini + 1800);
      return { opacity: suave(p), transform: [{ translateY: (1 - suave(p)) * 6 * m }] };
    }
    const p = suave(prog(v, ini, ini + 850));
    return { opacity: p, transform: [{ translateY: (1 - p) * 18 * m }] };
  });
  return (
    <Animated.View style={[caixa, a]}>
      <Text style={estilo}>{texto}</Text>
    </Animated.View>
  );
}

// frase quebrada em palavras que entram uma depois da outra
export function Palavras({
  t,
  ini,
  passo,
  m,
  modo,
  texto,
  estilo,
  caixa,
  alinhar = 'center',
}: {
  t: SharedValue<number>;
  ini: number;
  passo: number;
  m: number;
  modo?: Modo;
  texto: string;
  estilo: StyleProp<TextStyle>;
  caixa?: StyleProp<ViewStyle>;
  alinhar?: 'center' | 'flex-start';
}) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: alinhar, columnGap: 10 }, caixa]}>
      {texto.split(/\s+/).map((p, i) => (
        <Surge key={`${p}-${i}`} t={t} ini={ini + i * passo} m={m} modo={modo} texto={p} estilo={estilo} />
      ))}
    </View>
  );
}

// linha de terminal sendo digitada letra por letra, com o cursor no fim
export function Digitado({
  t,
  ini,
  duracao: dur,
  texto,
  estilo,
  corCursor,
}: {
  t: SharedValue<number>;
  ini: number;
  duracao: number;
  texto: string;
  estilo: StyleProp<TextStyle>;
  corCursor: string;
}) {
  const [medida, setMedida] = useState(0);
  const n = Math.max(1, texto.length);
  const larg = useAnimatedStyle(() => {
    const p = prog(t.get(), ini, ini + dur);
    return { width: (Math.floor(p * n) / n) * medida, opacity: t.get() >= ini - 300 ? 1 : 0 };
  });
  const cursor = useAnimatedStyle(() => ({ opacity: t.get() < ini - 300 ? 0 : Math.floor(t.get() / 420) % 2 === 0 ? 1 : 0.15 }));
  const tamanho = StyleSheet.flatten(estilo)?.fontSize ?? 16;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* o texto tem a largura inteira e não encolhe; quem corta é a caixa de fora */}
      <Animated.View style={[{ overflow: 'hidden', alignItems: 'flex-start' }, larg]}>
        <Text style={[estilo, { width: medida + 2, flexShrink: 0 }]}>{texto}</Text>
      </Animated.View>
      <Animated.View style={[{ width: tamanho * 0.55, height: tamanho * 1.05, backgroundColor: corCursor, marginLeft: 2 }, cursor]} />
      {/* mede o texto inteiro numa caixa larga e invisível (dentro da linha ele seria cortado) */}
      <View style={estiloMedida} pointerEvents="none">
        <Text style={[estilo, { alignSelf: 'flex-start' }]} onLayout={(e) => setMedida(e.nativeEvent.layout.width)}>
          {texto}
        </Text>
      </View>
    </View>
  );
}

// número em rolos, como um odômetro; "valor" é um worklet que diz o número no instante v
export function Odometro({
  t,
  valor,
  digitos,
  tamanho,
  cor,
  fundo,
}: {
  t: SharedValue<number>;
  valor: (v: number) => number;
  digitos: number;
  tamanho: number;
  cor: string;
  fundo?: string;
}) {
  const linha = Math.round(tamanho * 1.2);
  return (
    <View style={{ flexDirection: 'row', gap: fundo ? 4 : 0 }}>
      {Array.from({ length: digitos }, (_, i) => (
        <Rolo key={i} t={t} valor={valor} casa={digitos - 1 - i} linha={linha} tamanho={tamanho} cor={cor} fundo={fundo} />
      ))}
    </View>
  );
}

function Rolo({
  t,
  valor,
  casa,
  linha,
  tamanho,
  cor,
  fundo,
}: {
  t: SharedValue<number>;
  valor: (v: number) => number;
  casa: number;
  linha: number;
  tamanho: number;
  cor: string;
  fundo?: string;
}) {
  const a = useAnimatedStyle(() => {
    const n = Math.max(0, valor(t.get()));
    const unidade = Math.pow(10, casa);
    const base = Math.floor(n / unidade) % 10;
    // a casa só gira quando as de baixo estão virando (do 9 pro 0), e só no fim da volta,
    // pra o número ficar parado e legível a maior parte do tempo
    const resto = n % unidade;
    const fracao = casa === 0 ? n % 1 : Math.max(0, resto - (unidade - 1));
    const gira = suave(Math.min(1, Math.max(0, (fracao - 0.7) / 0.3)));
    return { transform: [{ translateY: -(base + gira) * linha }] };
  });
  return (
    <View style={{ height: linha, overflow: 'hidden', backgroundColor: fundo, borderRadius: fundo ? 6 : 0, paddingHorizontal: fundo ? 6 : 0 }}>
      <Animated.View style={a}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <Text key={i} style={[mono, { height: linha, lineHeight: linha, fontSize: tamanho, color: cor, fontWeight: '700', textAlign: 'center' }]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

// gênero, duração e classificação embaixo do título
export function Ficha({ filme, tamanho, cor = 'rgba(255,255,255,0.82)' }: { filme: FilmeTrailer; tamanho: number; cor?: string }) {
  return (
    <View style={base.ficha}>
      <Text style={{ color: cor, fontSize: tamanho, fontWeight: '500' }}>
        {filme.genero} · {duracao(filme.duracaoMin)}
      </Text>
      <SeloClassificacao valor={filme.classificacao} tamanho={Math.round(tamanho * 1.25)} />
    </View>
  );
}

// aparece no instante ini, sem mexer
export function Aparece({ t, ini, dur = 600, estilo, children }: { t: SharedValue<number>; ini: number; dur?: number; estilo?: StyleProp<ViewStyle>; children: ReactNode }) {
  const a = useAnimatedStyle(() => ({ opacity: prog(t.get(), ini, ini + dur) }));
  return <Animated.View style={[estilo, a]}>{children}</Animated.View>;
}

// assinatura comum a todos: "Em cartaz / CineON / Escolha seu lugar abaixo."
export function Fecho({ t, largura, cor, fundo = '#000', fonte }: { t: SharedValue<number>; largura: number; cor: string; fundo?: string; fonte?: TextStyle }) {
  const tam = Math.round(Math.min(64, Math.max(30, largura * 0.085)));
  return (
    <Cena t={t} janela={[FECHO, TOTAL]} fundo={fundo} ultima>
      <View style={[cheio, base.centro]}>
        <Aparece t={t} ini={FECHO + 200}>
          <Text style={[base.rotulo, { color: cor, fontSize: Math.max(10, tam * 0.24), marginBottom: 8 }]}>EM CARTAZ</Text>
        </Aparece>
        <Aparece t={t} ini={FECHO + 300}>
          <Text style={[{ color: '#FFFFFF', fontSize: tam, fontWeight: '800', letterSpacing: -1.2 }, fonte]}>CineON</Text>
        </Aparece>
        <Aparece t={t} ini={FECHO + 1000}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: Math.max(12, tam * 0.3), marginTop: 10, fontWeight: '500' }}>Escolha seu lugar abaixo.</Text>
        </Aparece>
      </View>
    </Cena>
  );
}

const estiloMedida: ViewStyle = { position: 'absolute', left: 0, top: 0, width: 4000, opacity: 0 };

export const base = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  rotulo: { fontWeight: '700', letterSpacing: 3, textAlign: 'center' },
  cartao: { borderRadius: 8, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  ficha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
