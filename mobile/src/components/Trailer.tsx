// Trailer de 30 s feito em código: um relógio só (t, em ms) e cada cena calcula a
// própria opacidade e movimento a partir dele. Pausar é parar o relógio, nada mais.
// Com "reduzir movimento" as cenas só trocam esmaecendo, sem zoom nem deslize.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { SeloClassificacao } from '@/components/SeloClassificacao';
import type { Filme } from '@/models/tipos';
import { urlArquivo } from '@/services/api';
import { Icone } from '@/ui/componentes';
import { corDoFilme } from '@/ui/arteFilme';
import { useReduzirMovimento } from '@/ui/movimento';
import { roteiroDoFilme } from '@/ui/roteirosTrailer';
import { Tocavel } from '@/ui/Tocavel';
import { duracao } from '@/utils/formatar';

// linha do tempo, em ms
const ABERTURA = [0, 2600] as const;
const CENAS = [
  [2600, 7200],
  [7200, 11800],
  [11800, 16400],
  [16400, 21000],
] as const;
const TITULO = [21000, 27000] as const;
const FECHO = [27000, 30000] as const;
const TOTAL = 30000;
const TROCA = 320; // metade do esmaecimento entre cenas

const cheio = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Estado = 'capa' | 'tocando' | 'pausado' | 'fim';

type Props = { filme: Pick<Filme, 'id' | 'titulo' | 'sinopse' | 'genero' | 'duracaoMin' | 'classificacao' | 'posterUrl'>; largura: number };

export function Trailer({ filme, largura }: Props) {
  const reduzir = useReduzirMovimento();
  const t = useSharedValue(0);
  const [estado, setEstado] = useState<Estado>('capa');
  const fim = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estadoAtual = useRef<Estado>('capa');
  useEffect(() => {
    estadoAtual.current = estado;
  }, [estado]);

  const altura = Math.round((largura * 9) / 16);
  const poster = urlArquivo(filme.posterUrl);
  const cor = corDoFilme(filme.titulo, filme.id);
  const { frases } = roteiroDoFilme(filme);
  const m = reduzir ? 0 : 1;
  // tamanhos acompanham a largura do player
  const grande = Math.round(Math.min(46, Math.max(22, largura * 0.062)));
  const medio = Math.round(grande * 0.62);
  const miudo = Math.max(10, Math.round(grande * 0.3));

  function limparFim() {
    if (fim.current) clearTimeout(fim.current);
    fim.current = null;
  }

  function tocar() {
    const de = estadoAtual.current === 'fim' ? 0 : t.get();
    if (de === 0) t.set(0);
    const restante = TOTAL - de;
    t.set(withTiming(TOTAL, { duration: restante, easing: Easing.linear }));
    limparFim();
    fim.current = setTimeout(() => setEstado('fim'), restante);
    setEstado('tocando');
  }

  function pausar() {
    cancelAnimation(t);
    limparFim();
    setEstado('pausado');
  }

  // saiu da tela (foi pra sessão, por exemplo): pausa
  useFocusEffect(
    useCallback(
      () => () => {
        if (estadoAtual.current === 'tocando') {
          cancelAnimation(t);
          if (fim.current) clearTimeout(fim.current);
          fim.current = null;
          setEstado('pausado');
        }
      },
      [t],
    ),
  );
  useEffect(() => () => limparFim(), []);

  const progresso = useAnimatedStyle(() => ({ transform: [{ scaleX: t.get() / TOTAL }] }));

  const rotulo =
    estado === 'tocando'
      ? `Pausar o trailer de ${filme.titulo}`
      : estado === 'pausado'
        ? `Continuar o trailer de ${filme.titulo}`
        : estado === 'fim'
          ? `Ver de novo o trailer de ${filme.titulo}`
          : `Assistir ao trailer de ${filme.titulo}, 30 segundos`;

  return (
    <Tocavel
      onPress={() => (estado === 'tocando' ? pausar() : tocar())}
      escala={0.985}
      escalaHover={1.01}
      vibracao="leve"
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={[estilos.player, { width: largura, height: altura }]}>
      {/* abertura */}
      <Cena t={t} janela={ABERTURA} estilo={estilos.preto}>
        <Abertura t={t} m={m} tamanho={miudo} />
      </Cena>

      {/* 1: pôster inteiro num cartão chegando, fundo desfocado, frase à esquerda */}
      <Cena t={t} janela={CENAS[0]} estilo={estilos.preto}>
        <Fundo t={t} janela={CENAS[0]} m={m} uri={poster} cor={cor} zoom={[1.25, 1.35]} desloca={[0, 0]} escurece={0.55} desfoque={22} />
        <Cartaz t={t} janela={CENAS[0]} m={m} uri={poster} cor={cor} altura={altura * 0.76} estilo={{ right: largura * 0.07, top: altura * 0.12 }} />
        <Frase
          t={t}
          janela={CENAS[0]}
          m={m}
          estilo={[estilos.cantoBaixo, { left: largura * 0.07, right: largura * 0.07 + altura * 0.76 * (2 / 3) + 20, top: 0, bottom: 0, justifyContent: 'center' }]}
          texto={frases[0]}
          tamanho={grande}
          atraso={700}
        />
      </Cena>

      {/* 2: fundo desfocado correndo de lado, frase no meio */}
      <Cena t={t} janela={CENAS[1]} estilo={estilos.preto}>
        <Fundo t={t} janela={CENAS[1]} m={m} uri={poster} cor={cor} zoom={[1.5, 1.4]} desloca={[0.05, -0.05]} lado={[0.08, -0.08]} escurece={0.5} desfoque={30} />
        <Frase t={t} janela={CENAS[1]} m={m} estilo={estilos.meio} alinhar="center" texto={frases[1]} tamanho={grande} encolhe />
      </Cena>

      {/* 3: cor do filme, frase grande e um traço se desenhando */}
      <Cena t={t} janela={CENAS[2]} estilo={{ backgroundColor: cor }}>
        <View style={[estilos.meio, { paddingHorizontal: largura * 0.08, alignItems: 'flex-start' }]}>
          <Frase t={t} janela={CENAS[2]} m={m} texto={frases[2]} tamanho={Math.round(grande * 1.08)} solto encolhe />
          <Traco t={t} janela={CENAS[2]} largura={largura * 0.22} />
        </View>
      </Cena>

      {/* 4: escuro, um fio de luz abrindo e a frase */}
      <Cena t={t} janela={CENAS[3]} estilo={estilos.preto}>
        <View style={estilos.meio}>
          <Luz t={t} janela={CENAS[3]} largura={largura * 0.5} />
          <Frase t={t} janela={CENAS[3]} m={m} alinhar="center" texto={frases[3]} tamanho={medio * 1.25} atraso={500} solto />
        </View>
      </Cena>

      {/* título */}
      <Cena t={t} janela={TITULO} estilo={estilos.preto}>
        <Fundo t={t} janela={TITULO} m={m} uri={poster} cor={cor} zoom={[1.4, 1.25]} desloca={[0, 0]} escurece={0.62} desfoque={26} />
        <View style={[estilos.faixa, { height: altura * 0.1, top: 0 }]} />
        <View style={[estilos.faixa, { height: altura * 0.1, bottom: 0 }]} />
        <Titulo t={t} m={m} titulo={filme.titulo} tamanho={Math.round(grande * 1.25)} />
        <Meta t={t} estilo={{ bottom: altura * 0.2 }}>
          <Text style={[estilos.metaTexto, { fontSize: miudo * 1.25 }]}>
            {filme.genero} · {duracao(filme.duracaoMin)}
          </Text>
          <SeloClassificacao valor={filme.classificacao} tamanho={Math.round(miudo * 1.5)} />
        </Meta>
      </Cena>

      {/* fecho */}
      <Cena t={t} janela={FECHO} estilo={estilos.preto} ultima>
        <Fecho t={t} tamanho={medio} miudo={miudo} />
      </Cena>

      {/* capa antes de tocar */}
      {estado === 'capa' ? <Capa uri={poster} cor={cor} titulo={filme.titulo} altura={altura} largura={largura} miudo={miudo} grande={grande} /> : null}

      {/* pausado: botão no meio; no fim, uma pílula discreta no canto */}
      {estado === 'pausado' ? (
        <View style={[StyleSheet.absoluteFill, estilos.centro, { backgroundColor: 'rgba(0,0,0,0.3)' }]} pointerEvents="none">
          <BotaoRedondo icone="play" />
        </View>
      ) : null}
      {estado === 'fim' ? (
        <View style={estilos.pilula} pointerEvents="none">
          <Icone nome="refresh" tamanho={15} cor="#FFFFFF" />
          <Text style={estilos.pilulaTexto}>Ver de novo</Text>
        </View>
      ) : null}

      {estado !== 'capa' ? (
        <View style={estilos.trilho} pointerEvents="none">
          <Animated.View style={[estilos.barra, progresso]} />
        </View>
      ) : null}
    </Tocavel>
  );
}

// opacidade da cena: entra e sai esmaecendo nas bordas da janela
function Cena({ t, janela, estilo, ultima, children }: { t: SharedValue<number>; janela: readonly [number, number]; estilo?: StyleProp<ViewStyle>; ultima?: boolean; children: ReactNode }) {
  const [ini, fim] = janela;
  const a = useAnimatedStyle(() => {
    const v = t.get();
    const entra = ini === 0 ? interpolate(v, [0, 500], [0, 1], CLAMP) : interpolate(v, [ini - TROCA, ini + TROCA], [0, 1], CLAMP);
    const sai = ultima ? 1 : interpolate(v, [fim - TROCA, fim + TROCA], [1, 0], CLAMP);
    return { opacity: Math.min(entra, sai) };
  });
  return <Animated.View style={[StyleSheet.absoluteFill, estilo, a]} pointerEvents="none">{children}</Animated.View>;
}

// pôster (ou a cor do filme) com zoom e deslize lentos, escurecido pra o texto aparecer
function Fundo({
  t,
  janela,
  m,
  uri,
  cor,
  zoom,
  desloca,
  lado = [0, 0],
  escurece,
  desfoque = 0,
}: {
  t: SharedValue<number>;
  janela: readonly [number, number];
  m: number;
  uri: string | null;
  cor: string;
  zoom: [number, number];
  desloca: [number, number];
  lado?: [number, number];
  escurece: number;
  desfoque?: number;
}) {
  const [ini, fim] = janela;
  const [altura, setAltura] = useState(200);
  const [largura, setLargura] = useState(360);
  const a = useAnimatedStyle(() => {
    const p = interpolate(t.get(), [ini - TROCA, fim + TROCA], [0, 1], CLAMP);
    const z = zoom[0] + (zoom[1] - zoom[0]) * p * m;
    return {
      transform: [
        { translateX: (lado[0] + (lado[1] - lado[0]) * p) * largura * m },
        { translateY: (desloca[0] + (desloca[1] - desloca[0]) * p) * altura * m },
        { scale: m ? z : zoom[0] },
      ],
    };
  });
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        setAltura(e.nativeEvent.layout.height);
        setLargura(e.nativeEvent.layout.width);
      }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cor }, a]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={desfoque} accessibilityIgnoresInvertColors /> : null}
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${escurece})` }]} />
    </View>
  );
}

// o pôster inteiro, em pé, chegando devagar (o corte 16:9 cortava o título do cartaz)
function Cartaz({
  t,
  janela,
  m,
  uri,
  cor,
  altura,
  estilo,
}: {
  t: SharedValue<number>;
  janela: readonly [number, number];
  m: number;
  uri: string | null;
  cor: string;
  altura: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  const [ini, fim] = janela;
  const a = useAnimatedStyle(() => {
    const v = t.get();
    const chegada = interpolate(v, [ini, ini + 1100], [0, 1], CLAMP);
    const suave = 1 - Math.pow(1 - chegada, 3);
    const deriva = interpolate(v, [ini, fim], [0, 1], CLAMP);
    return {
      opacity: suave,
      transform: [{ translateY: ((1 - suave) * 26 - deriva * 6) * m }, { scale: 1 + ((1 - suave) * 0.06 + deriva * 0.04) * m }],
    };
  });
  return (
    <Animated.View style={[estilos.cartaz, { height: altura, width: (altura * 2) / 3, backgroundColor: cor }, estilo, a]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
    </Animated.View>
  );
}

// frase que sobe e aparece; "encolhe" faz ela chegar um pouco maior e assentar
function Frase({
  t,
  janela,
  m,
  texto,
  tamanho,
  estilo,
  alinhar = 'left',
  atraso = 260,
  encolhe,
  solto,
}: {
  t: SharedValue<number>;
  janela: readonly [number, number];
  m: number;
  texto: string;
  tamanho: number;
  estilo?: StyleProp<ViewStyle>;
  alinhar?: TextStyle['textAlign'];
  atraso?: number;
  encolhe?: boolean;
  solto?: boolean;
}) {
  const [ini] = janela;
  const a = useAnimatedStyle(() => {
    const p = interpolate(t.get(), [ini + atraso, ini + atraso + 900], [0, 1], CLAMP);
    const suave = 1 - Math.pow(1 - p, 3);
    return {
      opacity: suave,
      transform: [{ translateY: (1 - suave) * 18 * m }, { scale: encolhe ? 1 + (1 - suave) * 0.08 * m : 1 }],
    };
  });
  return (
    <Animated.View style={[solto ? null : { paddingHorizontal: 24 }, estilo, a]}>
      <Text style={[estilos.frase, { fontSize: tamanho, lineHeight: Math.round(tamanho * 1.12), textAlign: alinhar }]}>{texto}</Text>
    </Animated.View>
  );
}

function Traco({ t, janela, largura }: { t: SharedValue<number>; janela: readonly [number, number]; largura: number }) {
  const [ini] = janela;
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: interpolate(t.get(), [ini + 700, ini + 1900], [0, 1], CLAMP) }] }));
  return <Animated.View style={[estilos.traco, { width: largura }, a]} />;
}

function Luz({ t, janela, largura }: { t: SharedValue<number>; janela: readonly [number, number]; largura: number }) {
  const [ini, fim] = janela;
  const a = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: interpolate(v, [ini, ini + 300, fim - 600, fim], [0, 1, 1, 0.4], CLAMP),
      transform: [{ scaleX: interpolate(v, [ini, ini + 1400], [0.02, 1], CLAMP) }],
    };
  });
  return <Animated.View style={[estilos.luz, { width: largura }, a]} />;
}

function Abertura({ t, m, tamanho }: { t: SharedValue<number>; m: number; tamanho: number }) {
  const a = useAnimatedStyle(() => {
    const v = t.get();
    return { opacity: interpolate(v, [300, 1100, 2000, 2500], [0, 1, 1, 0], CLAMP), transform: [{ scale: 1 + interpolate(v, [0, 2600], [0, 0.06], CLAMP) * m }] };
  });
  return (
    <Animated.View style={[estilos.centroTudo, a]}>
      <Text style={[estilos.apresenta, { fontSize: tamanho * 1.1 }]}>CINEON APRESENTA</Text>
    </Animated.View>
  );
}

function Titulo({ t, m, titulo, tamanho }: { t: SharedValue<number>; m: number; titulo: string; tamanho: number }) {
  const [ini] = TITULO;
  const a = useAnimatedStyle(() => {
    const p = interpolate(t.get(), [ini + 200, ini + 1600], [0, 1], CLAMP);
    const suave = 1 - Math.pow(1 - p, 3);
    return { opacity: suave, transform: [{ scale: 1 + (1 - suave) * 0.1 * m }] };
  });
  return (
    <Animated.View style={[estilos.centroTudo, a]}>
      <Text style={[estilos.titulo, { fontSize: tamanho, lineHeight: Math.round(tamanho * 1.05) }]}>{titulo}</Text>
    </Animated.View>
  );
}

function Meta({ t, estilo, children }: { t: SharedValue<number>; estilo?: StyleProp<ViewStyle>; children: ReactNode }) {
  const [ini] = TITULO;
  const a = useAnimatedStyle(() => ({ opacity: interpolate(t.get(), [ini + 1500, ini + 2300], [0, 1], CLAMP) }));
  return <Animated.View style={[estilos.meta, estilo, a]}>{children}</Animated.View>;
}

function Fecho({ t, tamanho, miudo }: { t: SharedValue<number>; tamanho: number; miudo: number }) {
  const [ini] = FECHO;
  const a = useAnimatedStyle(() => ({ opacity: interpolate(t.get(), [ini + 200, ini + 900], [0, 1], CLAMP) }));
  const b = useAnimatedStyle(() => ({ opacity: interpolate(t.get(), [ini + 900, ini + 1600], [0, 1], CLAMP) }));
  return (
    <View style={estilos.centroTudo}>
      <Animated.Text style={[estilos.apresenta, { fontSize: miudo * 1.1, marginBottom: 10 }, a]}>EM CARTAZ</Animated.Text>
      <Animated.Text style={[estilos.marca, { fontSize: tamanho * 1.6 }, a]}>CineON</Animated.Text>
      <Animated.Text style={[estilos.convite, { fontSize: miudo * 1.3 }, b]}>Escolha seu lugar abaixo.</Animated.Text>
    </View>
  );
}

// antes de tocar: fundo desfocado, o pôster em pé à esquerda e o título com o play
function Capa({ uri, cor, titulo, altura, largura, miudo, grande }: { uri: string | null; cor: string; titulo: string; altura: number; largura: number; miudo: number; grande: number }) {
  const alturaCartaz = altura * 0.74;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: cor }]} pointerEvents="none">
      {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.3 }] }]} resizeMode="cover" blurRadius={24} accessibilityIgnoresInvertColors /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      <View style={[estilos.capaConteudo, { paddingHorizontal: largura * 0.06, gap: largura * 0.05 }]}>
        <View style={[estilos.cartaz, { position: 'relative', height: alturaCartaz, width: (alturaCartaz * 2) / 3, backgroundColor: cor }]}>
          {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[estilos.apresenta, { fontSize: miudo, textAlign: 'left' }]}>TRAILER · 0:30</Text>
          <Text style={[estilos.capaTitulo, { fontSize: Math.round(grande * 0.78), lineHeight: Math.round(grande * 0.88) }]} numberOfLines={3}>
            {titulo}
          </Text>
          <View style={{ marginTop: 10 }}>
            <BotaoRedondo icone="play" pequeno />
          </View>
        </View>
      </View>
    </View>
  );
}

function BotaoRedondo({ icone, pequeno }: { icone: 'play' | 'refresh'; pequeno?: boolean }) {
  const lado = pequeno ? 48 : 68;
  return (
    <View style={[estilos.redondo, { width: lado, height: lado, borderRadius: lado / 2 }]}>
      <View style={icone === 'play' ? { marginLeft: pequeno ? 3 : 4 } : null}>
        <Icone nome={icone} tamanho={pequeno ? 22 : 30} cor="#FFFFFF" />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  player: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  preto: { backgroundColor: '#000' },
  centro: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  centroTudo: { ...cheio, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  meio: { ...cheio, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  cantoBaixo: { position: 'absolute', paddingHorizontal: 0 },
  frase: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.6 },
  titulo: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -1, textAlign: 'center' },
  apresenta: { color: 'rgba(255,255,255,0.72)', fontWeight: '600', letterSpacing: 3.2, textAlign: 'center' },
  marca: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -1.2 },
  convite: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontWeight: '500' },
  traco: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)', marginTop: 18, transformOrigin: 'left', alignSelf: 'flex-start' },
  luz: { height: 1.5, backgroundColor: '#FFFFFF', marginBottom: 22 },
  faixa: { position: 'absolute', left: 0, right: 0, backgroundColor: '#000' },
  meta: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  metaTexto: { color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  redondo: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  capaConteudo: { ...cheio, flexDirection: 'row', alignItems: 'center' },
  capaTitulo: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.5 },
  cartaz: { position: 'absolute', borderRadius: 8, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  pilula: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pilulaTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  trilho: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  barra: { ...cheio, backgroundColor: '#FFFFFF', transformOrigin: 'left' },
});
