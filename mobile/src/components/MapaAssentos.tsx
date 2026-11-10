import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { MapaSessao } from '@/models/tipos';
import { cores, espaco, raio } from '@/ui/tema';

const TAMANHO = 32;
const GAP = 5;

type Props = {
  mapa: MapaSessao;
  selecionados: number[];
  aoTocar: (assentoId: number) => void;
};

export function MapaAssentos({ mapa, selecionados, aoTocar }: Props) {
  // diminui o assento pra fila caber na tela; se ficar menor que 22px, rola na horizontal
  const { width } = useWindowDimensions();
  const maiorFila = Math.max(1, ...mapa.filas.map((f) => f.assentos.length));
  const disponivel = Math.min(width, 700) - 2 * espaco.l - 2 * (16 + GAP);
  const tamanho = Math.max(22, Math.min(TAMANHO, Math.floor(disponivel / maiorFila) - GAP));
  const dimensao = { width: tamanho, height: tamanho };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.rolagem}>
        <View style={{ gap: GAP }}>
          <View style={estilos.tela}>
            <Text style={estilos.telaTexto}>TELA</Text>
          </View>
          {mapa.filas.map((f) => (
            <View key={f.fila} style={estilos.fila}>
              <Text style={estilos.letra}>{f.fila}</Text>
              {f.assentos.map((a) => {
                const selecionado = selecionados.includes(a.id);
                const livre = a.status === 'LIVRE';
                const visual = selecionado
                  ? estilos.selecionado
                  : a.minhaReserva
                    ? estilos.minhaReserva
                    : a.status === 'VENDIDO'
                      ? estilos.vendido
                      : a.status === 'RESERVADO'
                        ? estilos.reservado
                        : estilos.livre;
                return (
                  <Pressable
                    key={a.id}
                    disabled={!livre}
                    onPress={() => aoTocar(a.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Fila ${f.fila}, assento ${a.numero}, ${selecionado ? 'selecionado' : a.status.toLowerCase()}`}
                    style={({ pressed }) => [estilos.assento, dimensao, visual, pressed && { opacity: 0.6 }]}>
                    <Text style={[estilos.numero, selecionado && { color: '#FFFFFF' }, a.status === 'VENDIDO' && { color: cores.textoSecundario }]}>
                      {a.numero}
                    </Text>
                  </Pressable>
                );
              })}
              <Text style={estilos.letra}>{f.fila}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={estilos.legenda}>
        <ItemLegenda estilo={estilos.livre} texto="Livre" />
        <ItemLegenda estilo={estilos.selecionado} texto="Escolhido" />
        <ItemLegenda estilo={estilos.reservado} texto="Reservado" />
        <ItemLegenda estilo={estilos.vendido} texto="Vendido" />
      </View>
    </View>
  );
}

function ItemLegenda({ estilo, texto }: { estilo: object; texto: string }) {
  return (
    <View style={estilos.itemLegenda}>
      <View style={[estilos.amostra, estilo]} />
      <Text style={estilos.textoLegenda}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  rolagem: { paddingHorizontal: espaco.l, flexGrow: 1, justifyContent: 'center' },
  tela: {
    height: 22,
    marginHorizontal: 30,
    marginBottom: espaco.m,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 3,
    borderColor: cores.bordaAssento,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  telaTexto: { fontSize: 11, letterSpacing: 4, color: cores.textoSecundario },
  fila: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  letra: { width: 16, textAlign: 'center', fontSize: 12, fontWeight: '600', color: cores.textoSecundario },
  assento: { borderRadius: raio.pequeno, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 11, color: cores.texto },
  livre: { backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.bordaAssento },
  selecionado: { backgroundColor: cores.azul },
  reservado: { backgroundColor: cores.laranjaClaro, borderWidth: 1, borderColor: cores.laranja },
  vendido: { backgroundColor: cores.cinzaAssento },
  minhaReserva: { backgroundColor: cores.azulClaro, borderWidth: 2, borderColor: cores.azul },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espaco.l, marginTop: espaco.l, paddingHorizontal: espaco.l },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amostra: { width: 16, height: 16, borderRadius: 4 },
  textoLegenda: { fontSize: 13, color: cores.textoSecundario },
});
