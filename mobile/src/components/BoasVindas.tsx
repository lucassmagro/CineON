// Momento de boas-vindas logo depois de entrar. A tela de login some sob um fundo sólido,
// o ícone do CineON surge com uma mola e solta dois pulsos de luz (o projetor acendendo),
// a saudação sobe esmaecendo e, no fim, tudo cresce de leve e some, revelando o app.
// Um toque pula a animação. Com "reduzir movimento" vira só um esmaecimento curto.
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import type { BoasVindas as Dados } from '@/contexts/AuthContext';
import { curva } from '@/ui/animacoes';
import { Texto } from '@/ui/componentes';
import { useReduzirMovimento } from '@/ui/movimento';
import { useTema } from '@/ui/tema';

const SAIDA_EM = 1650; // quando começa a sair
const DURACAO_SAIDA = 480;

function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function BoasVindas({ dados, aoTerminar }: { dados: Dados; aoTerminar: () => void }) {
  const c = useTema();
  const reduzir = useReduzirMovimento();

  const fundo = useSharedValue(0);
  const icone = useSharedValue(reduzir ? 1 : 0);
  const luz1 = useSharedValue(0);
  const luz2 = useSharedValue(0);
  const titulo = useSharedValue(reduzir ? 1 : 0);
  const linha = useSharedValue(reduzir ? 1 : 0);
  const saida = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const saindo = useRef(false);

  function sair() {
    if (saindo.current) return;
    saindo.current = true;
    timers.current.forEach(clearTimeout);
    saida.set(withTiming(1, { duration: DURACAO_SAIDA, easing: curva }));
    fundo.set(withTiming(0, { duration: DURACAO_SAIDA + 60, easing: curva }));
    timers.current = [setTimeout(aoTerminar, DURACAO_SAIDA + 80)];
  }

  useEffect(() => {
    fundo.set(withTiming(1, { duration: 260, easing: curva }));
    if (reduzir) {
      timers.current.push(setTimeout(sair, 900));
    } else {
      icone.set(withDelay(120, withSpring(1, { damping: 13, stiffness: 160, mass: 0.8 })));
      luz1.set(withDelay(300, withTiming(1, { duration: 1100, easing: curva })));
      luz2.set(withDelay(520, withTiming(1, { duration: 1100, easing: curva })));
      titulo.set(withDelay(420, withTiming(1, { duration: 560, easing: curva })));
      linha.set(withDelay(600, withTiming(1, { duration: 560, easing: curva })));
      timers.current.push(setTimeout(sair, SAIDA_EM));
      if (Platform.OS !== 'web') {
        timers.current.push(setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 160));
      }
    }
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
    // roda uma vez só, quando a animação aparece
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estiloFundo = useAnimatedStyle(() => ({ opacity: fundo.get() }));
  // na saída tudo cresce um pouco enquanto some, como se a tela viesse pra frente
  const estiloConteudo = useAnimatedStyle(() => ({
    opacity: 1 - saida.get(),
    transform: [{ scale: 1 + saida.get() * 0.06 }],
  }));
  const estiloIcone = useAnimatedStyle(() => ({
    opacity: Math.min(1, icone.get() * 1.4),
    transform: [{ scale: 0.72 + icone.get() * 0.28 }],
  }));
  const estiloTitulo = useAnimatedStyle(() => ({ opacity: titulo.get(), transform: [{ translateY: (1 - titulo.get()) * 12 }] }));
  const estiloLinha = useAnimatedStyle(() => ({ opacity: linha.get(), transform: [{ translateY: (1 - linha.get()) * 10 }] }));

  const texto = `${saudacao(dados.hora)}, ${dados.nome}.`;
  const complemento = dados.operador ? 'Bom trabalho.' : 'Bom filme.';

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.fundo, zIndex: 50 }, estiloFundo]}>
      <Pressable onPress={sair} accessibilityRole="button" accessibilityLabel={`${texto} ${complemento} Toque para continuar.`} style={estilos.toque}>
        <Animated.View style={[estilos.centro, estiloConteudo]}>
          <View style={estilos.palco}>
            <Pulso progresso={luz1} cor={c.rotulo} />
            <Pulso progresso={luz2} cor={c.rotulo} />
            <Animated.View style={[estilos.icone, { backgroundColor: c.rotulo }, estiloIcone]}>
              <Ionicons name="film" size={44} color={c.fundo} />
            </Animated.View>
          </View>
          <Animated.View style={estiloTitulo}>
            <Texto tipo="tituloGrande" style={estilos.titulo}>
              {texto}
            </Texto>
          </Animated.View>
          <Animated.View style={estiloLinha}>
            <Texto tipo="titulo3" cor="secundario" style={{ textAlign: 'center' }}>
              {complemento}
            </Texto>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// anel fino que se abre a partir do ícone e some, como a luz do projetor acendendo
function Pulso({ progresso, cor }: { progresso: SharedValue<number>; cor: string }) {
  const estilo = useAnimatedStyle(() => ({
    opacity: progresso.get() === 0 ? 0 : 0.45 * (1 - progresso.get()),
    transform: [{ scale: 1 + progresso.get() * 1.6 }],
  }));
  return <Animated.View pointerEvents="none" style={[estilos.pulso, { borderColor: cor }, estilo]} />;
}

const ICONE = 92;

const estilos = StyleSheet.create({
  toque: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  palco: { width: ICONE, height: ICONE, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  icone: { width: ICONE, height: ICONE, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  pulso: { position: 'absolute', width: ICONE, height: ICONE, borderRadius: ICONE / 2, borderWidth: 1.5 },
  titulo: { textAlign: 'center', letterSpacing: -0.6 },
});
