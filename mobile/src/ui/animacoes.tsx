// Pedacinhos de movimento usados nas telas, feitos com o Reanimated.
// O Reanimated já respeita o "reduzir movimento" do sistema nas entradas.
import { useEffect, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useReduzirMovimento } from './movimento';

// mesma curva do movimento.ts, mas no formato que o Reanimated entende
export const curva = Easing.bezier(0.2, 0, 0, 1);

// entrada de itens de grade e lista: sobe um pouco esmaecendo, um depois do outro
export function Surgir({ indice = 0, children, style }: { indice?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const entrada = FadeInDown.delay(Math.min(indice, 12) * 45)
    .duration(460)
    .easing(curva)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });
  return (
    <Animated.View entering={entrada} style={style}>
      {children}
    </Animated.View>
  );
}

// conteúdo da tela aparecendo quando termina de carregar
export const entradaTela = FadeIn.duration(280).easing(curva);

// dá um pulinho quando a chave muda (contador, total a pagar)
export function Pulso({ chave, children, style, intensidade = 1.18 }: { chave: string | number; children: ReactNode; style?: StyleProp<ViewStyle>; intensidade?: number }) {
  const reduzir = useReduzirMovimento();
  const tamanho = useSharedValue(1);
  const anterior = useRef(chave);

  useEffect(() => {
    if (anterior.current === chave) return;
    anterior.current = chave;
    if (reduzir) return;
    tamanho.set(withSequence(withTiming(intensidade, { duration: 90 }), withSpring(1, { damping: 11, stiffness: 280 })));
  }, [chave, intensidade, reduzir, tamanho]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: tamanho.get() }] }));
  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}
