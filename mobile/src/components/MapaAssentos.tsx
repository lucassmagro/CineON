import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { MapaSessao } from '@/models/tipos';
import { Pulso } from '@/ui/animacoes';
import { Texto } from '@/ui/componentes';
import { espaco, tipos, useTema } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';

const TAMANHO_MAX = 34;
const GAP = 6;

type Props = {
  mapa: MapaSessao;
  selecionados: number[];
  aoTocar: (assentoId: number) => void;
};

export function MapaAssentos({ mapa, selecionados, aoTocar }: Props) {
  const c = useTema();
  const cor = c.azul;
  const { width } = useWindowDimensions();

  // diminui o assento pra fila caber na tela; se ficar menor que 22px, rola na horizontal
  const maiorFila = Math.max(1, ...mapa.filas.map((f) => f.assentos.length));
  const disponivel = Math.min(width, 640) - 2 * espaco.l - 2 * (18 + GAP);
  const tamanho = Math.max(22, Math.min(TAMANHO_MAX, Math.floor(disponivel / maiorFila) - GAP));

  return (
    <View>
      {/* a tela do cinema: só um arco fino */}
      <View style={estilos.telaArea}>
        <View style={[estilos.telaArco, { borderColor: c.rotuloTerciario }]} />
        <Texto tipo="legenda" cor="secundario">
          Tela
        </Texto>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.rolagem}>
        <View style={{ gap: GAP }}>
          {mapa.filas.map((f) => (
            <View key={f.fila} style={estilos.fila}>
              <Text style={[tipos.legenda, estilos.letra, { color: c.rotuloTerciario }]}>{f.fila}</Text>
              {f.assentos.map((a) => {
                const escolhido = selecionados.includes(a.id);
                const livre = a.status === 'LIVRE';
                const fundo = escolhido
                  ? cor
                  : a.minhaReserva
                    ? c.azul + '33'
                    : livre
                      ? c.fundoElevado
                      : c.preenchimento;
                return (
                  <Pulso key={a.id} chave={escolhido ? 'sim' : 'nao'} intensidade={escolhido ? 1.22 : 0.92}>
                  <Tocavel
                    disabled={!livre}
                    onPress={() => aoTocar(a.id)}
                    escala={0.82}
                    escalaHover={livre ? 1.12 : 1}
                    vibracao="selecao"
                    accessibilityRole="button"
                    accessibilityState={{ selected: escolhido, disabled: !livre }}
                    accessibilityLabel={`Fila ${f.fila}, assento ${a.numero}, ${escolhido ? 'escolhido' : a.status === 'LIVRE' ? 'livre' : a.status === 'VENDIDO' ? 'vendido' : 'reservado'}`}
                    hitSlop={2}
                    style={[
                      estilos.assento,
                      { width: tamanho, height: tamanho, backgroundColor: fundo },
                      livre && !escolhido && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: c.preenchimentoForte },
                    ]}>
                    {escolhido || livre ? (
                      <Text style={[tipos.legenda2, { color: escolhido ? '#FFFFFF' : c.rotuloSecundario, fontWeight: '600' }]}>{a.numero}</Text>
                    ) : null}
                  </Tocavel>
                  </Pulso>
                );
              })}
              <Text style={[tipos.legenda, estilos.letra, { color: c.rotuloTerciario }]}>{f.fila}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={estilos.legenda}>
        <Amostra estilo={{ backgroundColor: c.fundoElevado, borderWidth: 1, borderColor: c.preenchimentoForte }} texto="Livre" />
        <Amostra estilo={{ backgroundColor: cor }} texto="Escolhido" />
        <Amostra estilo={{ backgroundColor: c.preenchimento }} texto="Ocupado" />
      </View>
    </View>
  );
}

function Amostra({ estilo, texto }: { estilo: object; texto: string }) {
  return (
    <View style={estilos.itemLegenda}>
      <View style={[estilos.amostra, estilo]} />
      <Texto tipo="nota" cor="secundario">
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  telaArea: { alignItems: 'center', marginBottom: espaco.xxl, marginHorizontal: espaco.xxl, maxWidth: 520, width: '80%', alignSelf: 'center' },
  telaArco: {
    width: '100%',
    height: 18,
    borderTopWidth: 2.5,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  rolagem: { paddingHorizontal: espaco.l, flexGrow: 1, justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  letra: { width: 18, textAlign: 'center', fontWeight: '600' },
  // canto de cima mais redondo, lembrando o encosto da poltrona
  assento: { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, alignItems: 'center', justifyContent: 'center' },
  legenda: { flexDirection: 'row', justifyContent: 'center', gap: espaco.xl, marginTop: espaco.xl },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amostra: { width: 14, height: 14, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
