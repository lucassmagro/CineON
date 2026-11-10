// Pressable com resposta ao toque: encolhe com uma mola curta, solta com um pequeno
// balanço e, na Web, cresce de leve no hover. Todos os botões do app passam por aqui.
import * as Haptics from 'expo-haptics';
import { useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReduzirMovimento } from './movimento';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

// apertar é rápido; soltar tem um pouco de balanço, como no iOS
const molaApertar = { damping: 22, stiffness: 520, mass: 0.6 };
const molaSoltar = { damping: 14, stiffness: 260, mass: 0.7 };

export type Vibracao = 'leve' | 'media' | 'selecao' | 'nenhuma';

export function vibrar(tipo: Vibracao) {
  if (Platform.OS === 'web' || tipo === 'nenhuma') return;
  if (tipo === 'selecao') void Haptics.selectionAsync();
  else void Haptics.impactAsync(tipo === 'media' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
}

type Estado = { pressionado: boolean; hover: boolean };

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** somado ao style enquanto o dedo está em cima */
  estiloPressionado?: StyleProp<ViewStyle>;
  children?: ReactNode | ((estado: Estado) => ReactNode);
  /** quanto encolhe ao pressionar (1 = não encolhe) */
  escala?: number;
  /** só na Web, com o mouse em cima */
  escalaHover?: number;
  /** cor que acende por baixo do conteúdo enquanto pressiona (linhas de lista) */
  realce?: string;
  vibracao?: Vibracao;
};

export function Tocavel({
  style,
  estiloPressionado,
  children,
  escala = 0.96,
  escalaHover = 1,
  realce,
  vibracao = 'leve',
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: Props) {
  const reduzir = useReduzirMovimento();
  const tamanho = useSharedValue(1);
  const brilho = useSharedValue(0);
  const [estado, setEstado] = useState<Estado>({ pressionado: false, hover: false });
  // refs porque o hover e o toque chegam juntos e o state ainda não atualizou
  const apertado = useRef(false);
  const emCima = useRef(false);

  const estiloTamanho = useAnimatedStyle(() => ({ transform: [{ scale: tamanho.get() }] }));
  const estiloRealce = useAnimatedStyle(() => ({ opacity: brilho.get() }));

  function irPara(valor: number, apertando: boolean) {
    if (reduzir) return;
    tamanho.set(withSpring(valor, apertando ? molaApertar : molaSoltar));
  }

  return (
    <PressableAnimado
      {...props}
      disabled={disabled}
      onPress={(e) => {
        vibrar(vibracao);
        onPress?.(e);
      }}
      onPressIn={(e) => {
        apertado.current = true;
        setEstado((s) => ({ ...s, pressionado: true }));
        irPara(escala, true);
        if (realce) brilho.set(withTiming(1, { duration: 60 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        apertado.current = false;
        setEstado((s) => ({ ...s, pressionado: false }));
        irPara(emCima.current && !disabled ? escalaHover : 1, false);
        if (realce) brilho.set(withTiming(0, { duration: 320 }));
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        emCima.current = true;
        setEstado((s) => ({ ...s, hover: true }));
        if (!disabled && !apertado.current) irPara(escalaHover, false);
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        emCima.current = false;
        setEstado((s) => ({ ...s, hover: false }));
        if (!apertado.current) irPara(1, false);
        onHoverOut?.(e);
      }}
      style={[style, estado.pressionado ? estiloPressionado : null, escala !== 1 || escalaHover !== 1 ? estiloTamanho : null]}>
      {realce ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: realce }, estiloRealce]} />
      ) : null}
      {typeof children === 'function' ? children(estado) : children}
    </PressableAnimado>
  );
}
