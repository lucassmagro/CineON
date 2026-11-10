// Capa do filme. Com pôster, a imagem aparece esmaecendo por cima do bloco de cor
// (que fica de reserva enquanto carrega ou se o endereço falhar). Sem pôster, fica o
// bloco de cor sólida com o título em tipografia grande.
import { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { urlArquivo } from '@/services/api';
import { corDoFilme } from '@/ui/arteFilme';
import { curva } from '@/ui/animacoes';
import { tipos } from '@/ui/tema';

type Props = {
  titulo: string;
  id?: number;
  genero?: string;
  poster?: string | null;
  mini?: boolean;
  estilo?: StyleProp<ViewStyle>;
};

export function Arte({ titulo, id, genero, poster, mini = false, estilo }: Props) {
  const [largura, setLargura] = useState(160);
  // guarda qual endereço falhou: se o pôster mudar, tenta de novo
  const [falhou, setFalhou] = useState<string | null>(null);
  const fundo = corDoFilme(titulo, id);
  const endereco = urlArquivo(poster);
  const uri = endereco && endereco !== falhou ? endereco : null;

  if (mini) {
    return (
      <View style={[estilos.mini, { backgroundColor: fundo }, estilo]}>
        <Text style={estilos.inicial}>{titulo.trim()[0]?.toUpperCase()}</Text>
        {uri ? <Imagem key={uri} uri={uri} aoFalhar={() => setFalhou(uri)} /> : null}
      </View>
    );
  }

  // o título acompanha a largura da capa, e a maior palavra precisa caber inteira na linha
  const respiro = Math.max(10, Math.round(largura * 0.08));
  const maiorPalavra = Math.max(...titulo.split(/\s+/).map((p) => p.length), 1);
  const cabePalavra = (largura - 2 * respiro) / (maiorPalavra * 0.6);
  const fonte = Math.max(10, Math.min(30, Math.round(largura * 0.12), Math.floor(cabePalavra)));

  return (
    <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={[estilos.capa, { backgroundColor: fundo, padding: respiro }, estilo]}>
      {genero ? (
        <Text style={[tipos.legenda, estilos.genero]} numberOfLines={1}>
          {genero}
        </Text>
      ) : null}
      <Text style={[estilos.titulo, { fontSize: fonte, lineHeight: Math.round(fonte * 1.08) }]} numberOfLines={4}>
        {titulo}
      </Text>
      {uri ? <Imagem key={uri} uri={uri} aoFalhar={() => setFalhou(uri)} /> : null}
    </View>
  );
}

function Imagem({ uri, aoFalhar }: { uri: string; aoFalhar: () => void }) {
  const opacidade = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ opacity: opacidade.get() }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]} pointerEvents="none">
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onLoad={() => opacidade.set(withTiming(1, { duration: 380, easing: curva }))}
        onError={aoFalhar}
      />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  capa: { aspectRatio: 2 / 3, borderRadius: 12, justifyContent: 'flex-end', gap: 4, overflow: 'hidden' },
  // miniatura em pé, na proporção do pôster
  mini: { width: 40, height: 60, borderRadius: 7, marginVertical: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  genero: { color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  titulo: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.4 },
  inicial: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
});
