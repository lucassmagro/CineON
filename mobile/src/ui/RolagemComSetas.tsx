// Faixa que rola de lado, com setas nas pontas. No computador não dá pra arrastar
// com o mouse, então sem as setas o fim da lista ficava escondido.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTema } from './tema';
import { Tocavel } from './Tocavel';

const TAMANHO_SETA = 36;

export function RolagemComSetas({
  children,
  contentContainerStyle,
  centroSetas,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** altura (a partir do topo) onde ficam as setas; sem isso ficam no meio da faixa */
  centroSetas?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const posicao = useRef(0);
  const largura = useRef(0);
  const conteudo = useRef(0);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  // guarda a posição em ref e só mexe no state quando uma seta aparece ou some
  function conferir() {
    setPodeVoltar(posicao.current > 4);
    setPodeAvancar(posicao.current + largura.current < conteudo.current - 4);
  }

  function rolar(direcao: 1 | -1) {
    const maximo = Math.max(0, conteudo.current - largura.current);
    const destino = Math.min(maximo, Math.max(0, posicao.current + direcao * largura.current * 0.8));
    ref.current?.scrollTo({ x: destino, animated: true });
    // na Web o último evento de scroll da animação às vezes não chega e a seta ficava sobrando
    setTimeout(() => {
      posicao.current = destino;
      conferir();
    }, 450);
  }

  const topo = centroSetas !== undefined ? { top: centroSetas - TAMANHO_SETA / 2 } : { top: '50%' as const, marginTop: -TAMANHO_SETA / 2 };

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        onLayout={(e) => {
          largura.current = e.nativeEvent.layout.width;
          conferir();
        }}
        onContentSizeChange={(w) => {
          conteudo.current = w;
          conferir();
        }}
        onScroll={(e) => {
          posicao.current = e.nativeEvent.contentOffset.x;
          conferir();
        }}>
        {children}
      </ScrollView>
      {podeVoltar ? <Seta lado="esquerda" estilo={topo} aoTocar={() => rolar(-1)} /> : null}
      {podeAvancar ? <Seta lado="direita" estilo={topo} aoTocar={() => rolar(1)} /> : null}
    </View>
  );
}

function Seta({ lado, estilo, aoTocar }: { lado: 'esquerda' | 'direita'; estilo: ViewStyle; aoTocar: () => void }) {
  const c = useTema();
  return (
    <Tocavel
      onPress={aoTocar}
      escala={0.9}
      escalaHover={1.08}
      vibracao="selecao"
      accessibilityRole="button"
      accessibilityLabel={lado === 'esquerda' ? 'Ver anteriores' : 'Ver mais'}
      style={[
        estilos.seta,
        lado === 'esquerda' ? { left: 6 } : { right: 6 },
        estilo,
        { backgroundColor: c.fundoElevado, borderColor: c.separador },
      ]}>
      <Ionicons name={lado === 'esquerda' ? 'chevron-back' : 'chevron-forward'} size={20} color={c.rotulo} />
    </Tocavel>
  );
}

const estilos = StyleSheet.create({
  seta: {
    position: 'absolute',
    width: TAMANHO_SETA,
    height: TAMANHO_SETA,
    borderRadius: TAMANHO_SETA / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
