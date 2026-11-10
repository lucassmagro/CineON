// Pedacinhos de movimento usados nas telas, feitos com o Reanimated.
// Tudo aqui usa valores animados próprios, sem o `entering` do Reanimated: na Web ele
// deixa o item com position absolute uns 2 s depois de entrar (os itens se sobrepunham).
import { useEffect, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useReduzirMovimento } from './movimento';

// mesma curva do movimento.ts, mas no formato que o Reanimated entende
export const curva = Easing.bezier(0.2, 0, 0, 1);

// anima de 0 a 1 uma vez, quando o componente monta
function useEntrada(atraso: number, duracao: number) {
  const reduzir = useReduzirMovimento();
  const p = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    if (reduzir) return;
    p.set(withDelay(atraso, withTiming(1, { duration: duracao, easing: curva })));
  }, [atraso, duracao, reduzir, p]);
  return p;
}

// entrada de itens de grade e lista: sobe um pouco esmaecendo, um depois do outro
export function Surgir({ indice = 0, children, style }: { indice?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useEntrada(Math.min(indice, 12) * 45, 460);
  const estilo = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 14 }] }));
  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}

// conteúdo da tela aparecendo quando termina de carregar
export function AparecerTela({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useEntrada(0, 280);
  const estilo = useAnimatedStyle(() => ({ opacity: p.get() }));
  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}

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

// Abre e fecha com a altura de verdade (o layout de baixo acompanha quadro a quadro).
// O conteúdo fica sempre montado: é medido numa camada solta e a caixa de fora anima até ele.
export function Expandir({ aberto, children, duracao = 420 }: { aberto: boolean; children: ReactNode; duracao?: number }) {
  const reduzir = useReduzirMovimento();
  const altura = useSharedValue(0);
  const visivel = useSharedValue(aberto ? 1 : 0);
  const medida = useRef(0);
  const jaMediu = useRef(false);

  function ir(alturaFinal: number) {
    // na primeira medida só coloca no lugar, pra tela não abrir animando
    if (reduzir || !jaMediu.current) {
      altura.set(alturaFinal);
      visivel.set(aberto ? 1 : 0);
      return;
    }
    altura.set(withTiming(alturaFinal, { duration: duracao, easing: curva }));
    // ao abrir o conteúdo aparece um pouco depois; ao fechar some logo
    visivel.set(withTiming(aberto ? 1 : 0, { duration: aberto ? duracao : duracao * 0.5, easing: curva }));
  }

  useEffect(() => {
    if (!jaMediu.current) return;
    ir(aberto ? medida.current : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const caixa = useAnimatedStyle(() => ({ height: altura.get(), opacity: visivel.get() }));
  const conteudo = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - visivel.get()) * -8 }] }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, caixa]} pointerEvents={aberto ? 'auto' : 'none'} accessibilityElementsHidden={!aberto} importantForAccessibility={aberto ? 'auto' : 'no-hide-descendants'}>
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, conteudo]}
        onLayout={(e) => {
          medida.current = e.nativeEvent.layout.height;
          if (aberto) ir(medida.current);
          jaMediu.current = true;
        }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

// Entra quando monta: sobe, cresce de leve e aparece, com mola. Usado na chegada do ingresso.
export function Chegar({
  atraso = 0,
  deslocamento = 24,
  escalaInicial = 1,
  children,
  style,
}: {
  atraso?: number;
  deslocamento?: number;
  escalaInicial?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduzir = useReduzirMovimento();
  const progresso = useSharedValue(reduzir ? 1 : 0);

  useEffect(() => {
    if (reduzir) return;
    progresso.set(withDelay(atraso, withSpring(1, { damping: 16, stiffness: 150, mass: 0.9 })));
  }, [atraso, reduzir, progresso]);

  const estilo = useAnimatedStyle(() => {
    const p = progresso.get();
    return {
      opacity: Math.min(1, p * 1.6),
      transform: [{ translateY: (1 - p) * deslocamento }, { scale: escalaInicial + (1 - escalaInicial) * p }],
    };
  });
  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}

// Item que aparece em sequência quando o pai abre (os códigos dentro do passe).
export function EmSequencia({ indice, visivel, children }: { indice: number; visivel: boolean; children: ReactNode }) {
  const reduzir = useReduzirMovimento();
  const p = useSharedValue(visivel ? 1 : 0);

  useEffect(() => {
    if (reduzir) {
      p.set(visivel ? 1 : 0);
      return;
    }
    p.set(visivel ? withDelay(120 + Math.min(indice, 10) * 40, withTiming(1, { duration: 340, easing: curva })) : withTiming(0, { duration: 120 }));
  }, [visivel, indice, reduzir, p]);

  const estilo = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 8 }] }));
  return <Animated.View style={estilo}>{children}</Animated.View>;
}
