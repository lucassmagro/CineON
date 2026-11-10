// Barra de abas em pílula flutuante, centralizada embaixo da tela.
// Um destaque desliza até a aba escolhida e o ícone dá um pulinho ao ser ativado.
import { BlurView } from 'expo-blur';
import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pulso } from './animacoes';
import { useReduzirMovimento } from './movimento';
import { useTema } from './tema';
import { Tocavel } from './Tocavel';

// altura total da pílula, usada pelas telas pra deixar espaço embaixo
export const ALTURA_BARRA_ABAS = 64;
const RESPIRO = 6;
const LARGURA_ITEM = 84;

type Opcoes = {
  title?: string;
  tabBarIcon?: (p: { focused: boolean; color: string; size: number }) => ReactNode;
  tabBarAccessibilityLabel?: string;
};

export type PropsBarraAbas = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: Opcoes }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (nome: string) => void;
  };
};

// distância da pílula até a borda de baixo, já contando a área segura
export function useEspacoBarraAbas() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 4;
}

export function BarraAbas({ state, descriptors, navigation }: PropsBarraAbas) {
  const c = useTema();
  const reduzir = useReduzirMovimento();
  const { width } = useWindowDimensions();
  const distancia = useEspacoBarraAbas();

  // no celular estreito os itens encolhem pra sobrar margem dos dois lados
  const total = state.routes.length;
  const largura = Math.min(LARGURA_ITEM, Math.floor((width - 48 - RESPIRO * 2) / total));

  const posicao = useSharedValue(state.index * largura);
  const jaPosicionou = useRef(false);
  useEffect(() => {
    const destino = state.index * largura;
    if (reduzir || !jaPosicionou.current) posicao.set(destino);
    else posicao.set(withSpring(destino, { damping: 28, stiffness: 300, mass: 0.8 }));
    jaPosicionou.current = true;
  }, [state.index, largura, reduzir, posicao]);
  const estiloDestaque = useAnimatedStyle(() => ({ transform: [{ translateX: posicao.get() }] }));

  return (
    <View pointerEvents="box-none" style={[estilos.area, { bottom: distancia }]}>
      <View
        style={[
          estilos.pilula,
          { borderColor: c.separador, shadowOpacity: c.escuro ? 0.5 : 0.14 },
          Platform.OS === 'android' && { backgroundColor: c.fundoElevado },
        ]}>
        {Platform.OS !== 'android' ? (
          <BlurView
            intensity={80}
            tint={c.escuro ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
            style={[StyleSheet.absoluteFill, estilos.vidro]}
          />
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={[estilos.destaque, { width: largura, backgroundColor: c.escuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }, estiloDestaque]}
        />
        {state.routes.map((rota, i) => {
          const { options } = descriptors[rota.key]!;
          const ativa = state.index === i;
          const cor = ativa ? c.azul : c.cinza;
          const titulo = options.title ?? rota.name;
          return (
            <Tocavel
              key={rota.key}
              escala={0.9}
              vibracao="selecao"
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? titulo}
              onPress={() => {
                const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
                if (!ativa && !evento.defaultPrevented) navigation.navigate(rota.name);
              }}
              style={[estilos.item, { width: largura }]}>
              <Pulso chave={ativa ? 'ativa' : 'inativa'} intensidade={ativa ? 1.16 : 1}>
                {options.tabBarIcon?.({ focused: ativa, color: cor, size: 23 })}
              </Pulso>
              <Text style={[estilos.rotulo, { color: cor }]} numberOfLines={1}>
                {titulo}
              </Text>
            </Tocavel>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pilula: {
    flexDirection: 'row',
    padding: RESPIRO,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  vidro: { borderRadius: 999, overflow: 'hidden' },
  destaque: { position: 'absolute', top: RESPIRO, bottom: RESPIRO, left: RESPIRO, borderRadius: 999 },
  item: { height: ALTURA_BARRA_ABAS - RESPIRO * 2, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 999 },
  rotulo: { fontSize: 10, lineHeight: 13, fontWeight: '600' },
});
