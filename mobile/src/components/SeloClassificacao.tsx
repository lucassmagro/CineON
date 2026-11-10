// Selo da classificação indicativa com as cores oficiais do ClassInd.
import { StyleSheet, Text, View } from 'react-native';

const CORES: Record<string, { fundo: string; texto: string }> = {
  L: { fundo: '#0C9447', texto: '#FFFFFF' },
  '10': { fundo: '#0F7DC2', texto: '#FFFFFF' },
  '12': { fundo: '#F8C411', texto: '#1D1815' },
  '14': { fundo: '#E67824', texto: '#FFFFFF' },
  '16': { fundo: '#DB2827', texto: '#FFFFFF' },
  '18': { fundo: '#1D1815', texto: '#FFFFFF' },
};

export function textoClassificacao(c: string): string {
  return c === 'L' ? 'Livre para todos os públicos' : `Não recomendado para menores de ${c} anos`;
}

export function SeloClassificacao({ valor, tamanho = 22 }: { valor: string; tamanho?: number }) {
  const cor = CORES[valor] ?? CORES.L!;
  return (
    <View
      accessibilityLabel={textoClassificacao(valor)}
      style={[estilos.selo, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.22, backgroundColor: cor.fundo }]}>
      <Text style={[estilos.texto, { color: cor.texto, fontSize: tamanho * (valor === 'L' ? 0.6 : 0.5) }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: { alignItems: 'center', justifyContent: 'center' },
  texto: { fontWeight: '800', letterSpacing: -0.3 },
});
