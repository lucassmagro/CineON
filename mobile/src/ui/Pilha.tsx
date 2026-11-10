// Navegação em pilha. No celular usa a pilha nativa (com o deslize do próprio iOS/Android).
// Na Web usa a pilha em JS com uma transição suave: a tela nova entra deslizando um pouco
// e esmaecendo, enquanto a de trás recua. Formulários em modal sobem de baixo.
import { Stack } from 'expo-router';
import JSStack, { HeaderStyleInterpolators, type StackCardStyleInterpolator } from 'expo-router/js-stack';
import type { ReactNode } from 'react';
import { Animated, Platform } from 'react-native';

import { curvaApple, useReduzirMovimento } from './movimento';

const parado = new Animated.Value(0);

const deslizar: StackCardStyleInterpolator = ({ current, next }) => {
  const saida = next?.progress ?? parado;
  return {
    cardStyle: {
      opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      transform: [
        {
          translateX: Animated.add(
            current.progress.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }),
            saida.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }),
          ),
        },
      ],
    },
  };
};

const subir: StackCardStyleInterpolator = ({ current }) => ({
  cardStyle: {
    opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [{ translateY: current.progress.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
  },
});

const tempo = (duracao: number) => ({ animation: 'timing' as const, config: { duration: duracao, easing: curvaApple } });

function opcoesWeb(reduzir: boolean) {
  if (reduzir) return { animation: 'none' as const };
  return {
    // na Web o padrão da pilha é sem animação nenhuma, tem que ligar aqui
    animation: 'default' as const,
    cardStyleInterpolator: deslizar,
    headerStyleInterpolator: HeaderStyleInterpolators.forFade,
    transitionSpec: { open: tempo(360), close: tempo(280) },
    gestureEnabled: false,
    cardOverlayEnabled: false,
  };
}

// opções para telas apresentadas como modal (formulários)
export const opcoesModal = Platform.OS === 'web' ? { presentation: 'modal' as const, cardStyleInterpolator: subir } : { presentation: 'modal' as const };

type Props = { children?: ReactNode; screenOptions?: object };

export function Pilha({ children, screenOptions }: Props) {
  const reduzir = useReduzirMovimento();
  if (Platform.OS !== 'web') return <Stack screenOptions={screenOptions as never}>{children}</Stack>;
  return <JSStack screenOptions={{ ...opcoesWeb(reduzir), ...screenOptions }}>{children}</JSStack>;
}

// na Web o Stack.Screen é outro componente e a pilha em JS ignora as opções dele
Pilha.Screen = (Platform.OS === 'web' ? JSStack.Screen : Stack.Screen) as typeof Stack.Screen;
