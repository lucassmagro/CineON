// Botão redondo que troca entre claro e escuro. Um ícone esmaece enquanto o outro entra,
// girando só um pouco, no mesmo ritmo da troca de tema.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

import { useAparencia } from './aparencia';
import { useTema } from './tema';
import { Tocavel } from './Tocavel';

export function BotaoTema() {
  const c = useTema();
  const { escuro, alternar } = useAparencia();
  const [progresso] = useState(() => new Animated.Value(escuro ? 1 : 0));

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: escuro ? 1 : 0,
      duration: 460,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [escuro, progresso]);

  const entre = (a: number | string, b: number | string) =>
    progresso.interpolate({ inputRange: [0, 1], outputRange: [a, b] as number[] | string[] });

  const sol = { opacity: entre(1, 0), transform: [{ rotate: entre('0deg', '45deg') }, { scale: entre(1, 0.7) }] };
  const lua = { opacity: entre(0, 1), transform: [{ rotate: entre('-45deg', '0deg') }, { scale: entre(0.7, 1) }] };

  return (
    <Tocavel
      escala={0.86}
      escalaHover={1.06}
      onPress={() => alternar()}
      accessibilityRole="switch"
      accessibilityState={{ checked: escuro }}
      accessibilityLabel={escuro ? 'Usar modo claro' : 'Usar modo escuro'}
      hitSlop={8}
      style={[estilos.botao, { backgroundColor: c.preenchimento }]}>
      <Animated.View style={[estilos.icone, sol]}>
        <Ionicons name="sunny" size={19} color={c.rotulo} />
      </Animated.View>
      <Animated.View style={[estilos.icone, lua]}>
        <Ionicons name="moon" size={16} color={c.rotulo} />
      </Animated.View>
    </Tocavel>
  );
}

const estilos = StyleSheet.create({
  botao: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  icone: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
