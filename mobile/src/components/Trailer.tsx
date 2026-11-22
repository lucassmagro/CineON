// Player dos trailers de 30 s feitos em código. Aqui fica só o relógio (t, em ms), a capa,
// a pausa e a barra de progresso; as cenas são de cada estilo, em components/trailer.
// Pausar é parar o relógio. Com "reduzir movimento" os estilos tiram zoom e deslize.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ComponentType, type RefObject } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cheio, TOTAL, type FilmeTrailer, type PropsEstilo } from '@/components/trailer/base';
import { Classico } from '@/components/trailer/Classico';
import { Conversa } from '@/components/trailer/Conversa';
import { Corrida } from '@/components/trailer/Corrida';
import { Diario } from '@/components/trailer/Diario';
import { Oceano } from '@/components/trailer/Oceano';
import { Silencio } from '@/components/trailer/Silencio';
import { Tempo } from '@/components/trailer/Tempo';
import { urlArquivo } from '@/services/api';
import { Icone } from '@/ui/componentes';
import { paletaDoFilme, type PaletaFilme } from '@/ui/coresPoster';
import { useReduzirMovimento } from '@/ui/movimento';
import { roteiroDoFilme, type NomeEstilo } from '@/ui/roteirosTrailer';
import { Tocavel } from '@/ui/Tocavel';

const ESTILOS: Record<NomeEstilo, ComponentType<PropsEstilo>> = {
  corrida: Corrida,
  oceano: Oceano,
  diario: Diario,
  silencio: Silencio,
  conversa: Conversa,
  tempo: Tempo,
  classico: Classico,
};

type Estado = 'capa' | 'tocando' | 'pausado' | 'fim';

type Props = {
  filme: FilmeTrailer;
  largura: number;
  paleta?: PaletaFilme;
  /** pra página mandar tocar (o botão "Assistir ao trailer" lá em cima) */
  controle?: RefObject<ControleTrailer | null>;
};

export type ControleTrailer = { tocarDoComeco: () => void };

export function Trailer({ filme, largura, paleta: paletaPedida, controle }: Props) {
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
  const paleta = paletaPedida ?? paletaDoFilme(filme);
  const roteiro = roteiroDoFilme(filme);
  const Estilo = ESTILOS[roteiro.estilo];
  const g = Math.round(Math.min(46, Math.max(22, largura * 0.062)));

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

  // o botão "Assistir ao trailer" da página toca do começo
  useImperativeHandle(controle, () => ({
    tocarDoComeco() {
      cancelAnimation(t);
      estadoAtual.current = 'fim';
      tocar();
    },
  }));

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
      <Estilo t={t} m={reduzir ? 0 : 1} largura={largura} altura={altura} filme={filme} roteiro={roteiro} paleta={paleta} poster={poster} />

      {estado === 'capa' ? <Capa uri={poster} paleta={paleta} titulo={filme.titulo} altura={altura} largura={largura} grande={g} /> : null}

      {/* pausado: botão no meio; no fim, uma pílula discreta no canto */}
      {estado === 'pausado' ? (
        <View style={[StyleSheet.absoluteFill, estilos.centro, { backgroundColor: 'rgba(0,0,0,0.3)' }]} pointerEvents="none">
          <BotaoRedondo />
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
          <Animated.View style={[estilos.barra, progresso, { backgroundColor: paleta.destaque }]} />
        </View>
      ) : null}
    </Tocavel>
  );
}

// antes de tocar: fundo desfocado na cor do filme, o pôster em pé e o título com o play
function Capa({ uri, paleta, titulo, altura, largura, grande }: { uri: string | null; paleta: PaletaFilme; titulo: string; altura: number; largura: number; grande: number }) {
  const alturaCartaz = altura * 0.74;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: paleta.fundo }]} pointerEvents="none">
      {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.3 }] }]} resizeMode="cover" blurRadius={24} accessibilityIgnoresInvertColors /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: paleta.fundo, opacity: 0.62 }]} />
      <View style={[estilos.capaConteudo, { paddingHorizontal: largura * 0.06, gap: largura * 0.05 }]}>
        <View style={[estilos.cartaz, { height: alturaCartaz, width: (alturaCartaz * 2) / 3, backgroundColor: paleta.medio }]}>
          {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[estilos.rotulo, { color: paleta.destaque, fontSize: Math.max(10, Math.round(grande * 0.3)) }]}>TRAILER · 0:30</Text>
          <Text style={[estilos.capaTitulo, { fontSize: Math.round(grande * 0.78), lineHeight: Math.round(grande * 0.88) }]} numberOfLines={3}>
            {titulo}
          </Text>
          <View style={{ marginTop: 10 }}>
            <BotaoRedondo pequeno />
          </View>
        </View>
      </View>
    </View>
  );
}

function BotaoRedondo({ pequeno }: { pequeno?: boolean }) {
  const lado = pequeno ? 48 : 68;
  return (
    <View style={[estilos.redondo, { width: lado, height: lado, borderRadius: lado / 2 }]}>
      <View style={{ marginLeft: pequeno ? 3 : 4 }}>
        <Icone nome="play" tamanho={pequeno ? 22 : 30} cor="#FFFFFF" />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  player: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  centro: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  rotulo: { fontWeight: '700', letterSpacing: 3 },
  redondo: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  capaConteudo: { ...cheio, flexDirection: 'row', alignItems: 'center' },
  capaTitulo: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.5 },
  cartaz: { borderRadius: 8, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
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
  barra: { ...cheio, transformOrigin: 'left' },
});
