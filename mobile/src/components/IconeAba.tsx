import { Pressable, Text, type ColorValue } from 'react-native';

import { cores } from '@/ui/tema';

// por enquanto só um caractere no lugar do ícone
export function IconeAba({ simbolo, cor }: { simbolo: string; cor: ColorValue }) {
  return <Text style={{ fontSize: 17, color: cor, lineHeight: 20, height: 20 }}>{simbolo}</Text>;
}

export function BotaoNovo({ aoTocar }: { aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [{ paddingHorizontal: 8 }, pressed && { opacity: 0.5 }]}>
      <Text style={{ color: cores.azul, fontSize: 17 }}>Novo</Text>
    </Pressable>
  );
}
