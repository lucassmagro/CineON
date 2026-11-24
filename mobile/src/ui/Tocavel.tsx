// Pressable com resposta ao toque: encolhe com uma mola curta, solta com um pequeno
// balanço e, na Web, cresce de leve no hover. Todos os botões do app passam por aqui.
import * as Haptics from 'expo-haptics';
import { useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReduzirMovimento } from './movimento';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);
const naWeb = Platform.OS === 'web';

// apertar é rápido; soltar tem um pouco de balanço, como no iOS
const molaApertar = { damping: 22, stiffness: 520, mass: 0.6 };
// na Web o mouse continua em cima depois do clique, e o balanço parecia tremido
const molaSoltar = naWeb ? { damping: 26, stiffness: 300, mass: 0.8 } : { damping: 14, stiffness: 260, mass: 0.7 };
// hover é curva, não mola: entra rápido e assenta devagar
const curva = Easing.bezier(0.22, 1, 0.36, 1);
const entrarHover = { duration: 260, easing: curva };
const sairHover = { duration: 340, easing: curva };

// quanto a linha de lista acende com o mouse em cima (no toque vai até 1)
const REALCE_HOVER = 0.55;

export type Vibracao = 'leve' | 'media' | 'selecao' | 'nenhuma';

export function vibrar(tipo: Vibracao) {
  if (naWeb || tipo === 'nenhuma') return;
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
  const apagado = useSharedValue(1);
  const [estado, setEstado] = useState<Estado>({ pressionado: false, hover: false });
  // refs porque o hover e o toque chegam juntos e o state ainda não atualizou
  const apertado = useRef(false);
  const emCima = useRef(false);

  // a opacidade do apertado é animada; o resto (fundo etc.) ainda troca pelo state
  const { opacity: opacidadeApertado, ...restoApertado } = StyleSheet.flatten(estiloPressionado) ?? {};
  const opacidadeDoEstilo = StyleSheet.flatten(style)?.opacity;
  // botão desativado já vem com opacidade; o apertado multiplica em cima dela
  const opacidadeBase = typeof opacidadeDoEstilo === 'number' ? opacidadeDoEstilo : 1;
  // só re-renderiza quando alguém usa o estado, senão o hover redesenhava a tela no meio da animação
  const usaPressionado = typeof children === 'function' || Object.keys(restoApertado).length > 0;
  const usaHover = typeof children === 'function';
  const animaTamanho = escala !== 1 || escalaHover !== 1;
  const animaOpacidade = typeof opacidadeApertado === 'number';

  const estiloTamanho = useAnimatedStyle(() => ({ transform: [{ scale: tamanho.get() }] }));
  const estiloOpacidade = useAnimatedStyle(() => ({ opacity: opacidadeBase * apagado.get() }), [opacidadeBase]);
  const estiloRealce = useAnimatedStyle(() => ({ opacity: brilho.get() }));

  function apertar(valor: number) {
    if (!reduzir) tamanho.set(withSpring(valor, molaApertar));
  }
  function soltar(valor: number) {
    if (!reduzir) tamanho.set(withSpring(valor, molaSoltar));
  }
  function hover(valor: number, entrando: boolean) {
    if (!reduzir) tamanho.set(withTiming(valor, entrando ? entrarHover : sairHover));
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
        if (usaPressionado) setEstado((s) => ({ ...s, pressionado: true }));
        apertar(escala);
        if (animaOpacidade) apagado.set(withTiming(opacidadeApertado, { duration: 90 }));
        if (realce) brilho.set(withTiming(1, { duration: 70 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        apertado.current = false;
        if (usaPressionado) setEstado((s) => ({ ...s, pressionado: false }));
        soltar(emCima.current && !disabled ? escalaHover : 1);
        if (animaOpacidade) apagado.set(withTiming(1, { duration: 240, easing: curva }));
        if (realce) brilho.set(withTiming(emCima.current && !disabled ? REALCE_HOVER : 0, { duration: 320, easing: curva }));
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        emCima.current = true;
        if (usaHover) setEstado((s) => ({ ...s, hover: true }));
        if (!disabled && !apertado.current) {
          hover(escalaHover, true);
          if (realce) brilho.set(withTiming(REALCE_HOVER, { duration: 180, easing: curva }));
        }
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        emCima.current = false;
        if (usaHover) setEstado((s) => ({ ...s, hover: false }));
        if (!apertado.current) {
          hover(1, false);
          if (realce) brilho.set(withTiming(0, { duration: 300, easing: curva }));
        }
        onHoverOut?.(e);
      }}
      style={[
        style,
        estado.pressionado ? restoApertado : null,
        animaTamanho ? estiloTamanho : null,
        animaOpacidade ? estiloOpacidade : null,
      ]}>
      {realce ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: realce }, estiloRealce]} />
      ) : null}
      {typeof children === 'function' ? children(estado) : children}
    </PressableAnimado>
  );
}
