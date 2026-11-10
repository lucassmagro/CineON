// Escolha da aparência com miniaturas da tela, como em Ajustes > Tela e Brilho no iPhone.
// O "Automático" mostra a tela dividida: metade clara, metade escura.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pulso } from '@/ui/animacoes';
import type { Aparencia } from '@/ui/aparencia';
import { Texto } from '@/ui/componentes';
import { espaco, paletas, useTema, type Paleta } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';

const OPCOES: { valor: Aparencia; rotulo: string }[] = [
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'sistema', rotulo: 'Automático' },
];

export function SeletorAparencia({ valor, aoMudar }: { valor: Aparencia; aoMudar: (v: Aparencia) => void }) {
  return (
    <View style={estilos.linha} accessibilityRole="radiogroup">
      {OPCOES.map((o) => (
        <Opcao key={o.valor} {...o} ativa={o.valor === valor} aoTocar={() => aoMudar(o.valor)} />
      ))}
    </View>
  );
}

function Opcao({ valor, rotulo, ativa, aoTocar }: { valor: Aparencia; rotulo: string; ativa: boolean; aoTocar: () => void }) {
  const c = useTema();
  const [largura, setLargura] = useState(0);
  return (
    <Tocavel
      onPress={aoTocar}
      escala={0.95}
      escalaHover={1.02}
      vibracao="selecao"
      accessibilityRole="radio"
      accessibilityState={{ checked: ativa }}
      accessibilityLabel={rotulo}
      style={estilos.opcao}>
      <View
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        style={[estilos.moldura, { borderColor: ativa ? c.azul : c.separador, borderWidth: ativa ? 2 : StyleSheet.hairlineWidth }]}>
        {valor === 'sistema' ? (
          <View style={estilos.dividida}>
            <View style={estilos.metade}>
              <MiniTela paleta={paletas.claro} largura={largura} />
            </View>
            <View style={[estilos.metade, { alignItems: 'flex-end' }]}>
              <MiniTela paleta={paletas.escuro} largura={largura} />
            </View>
          </View>
        ) : (
          <MiniTela paleta={valor === 'escuro' ? paletas.escuro : paletas.claro} largura={largura} />
        )}
      </View>
      <Texto tipo="nota" peso={ativa ? '600' : '400'} style={{ marginTop: espaco.s }}>
        {rotulo}
      </Texto>
      <Pulso chave={ativa ? 'sim' : 'nao'} intensidade={ativa ? 1.25 : 1} style={{ marginTop: 6 }}>
        <View style={[estilos.marca, ativa ? { backgroundColor: c.azul, borderColor: c.azul } : { borderColor: c.rotuloTerciario }]}>
          {ativa ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </View>
      </Pulso>
    </Tocavel>
  );
}

// esboço de uma tela do app: título, dois cartões e a pílula das abas
function MiniTela({ paleta, largura }: { paleta: Paleta; largura: number }) {
  return (
    <View style={[estilos.tela, { backgroundColor: paleta.fundo, width: largura || '100%' }]}>
      <View style={[estilos.titulo, { backgroundColor: paleta.rotulo }]} />
      <View style={estilos.cartazes}>
        <View style={[estilos.cartaz, { backgroundColor: '#4E6E8E' }]} />
        <View style={[estilos.cartaz, { backgroundColor: '#8C5468' }]} />
      </View>
      <View style={[estilos.cartao, { backgroundColor: paleta.fundoElevado }]} />
      <View style={[estilos.abas, { backgroundColor: paleta.fundoElevado, borderColor: paleta.separador }]}>
        <View style={[estilos.ponto, { backgroundColor: paleta.azul }]} />
        <View style={[estilos.ponto, { backgroundColor: paleta.rotuloTerciario }]} />
        <View style={[estilos.ponto, { backgroundColor: paleta.rotuloTerciario }]} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.l, paddingHorizontal: espaco.l, paddingTop: espaco.l, paddingBottom: espaco.m },
  opcao: { flex: 1, alignItems: 'center' },
  moldura: { width: '100%', maxWidth: 120, aspectRatio: 0.62, borderRadius: 14, overflow: 'hidden' },
  dividida: { flex: 1, flexDirection: 'row' },
  metade: { flex: 1, overflow: 'hidden' },
  tela: { flex: 1, padding: 9, gap: 6 },
  titulo: { width: '55%', height: 7, borderRadius: 3, marginTop: 4, marginBottom: 2 },
  cartazes: { flexDirection: 'row', gap: 5 },
  cartaz: { flex: 1, aspectRatio: 2 / 3, borderRadius: 4 },
  cartao: { height: 16, borderRadius: 4 },
  abas: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    left: '22%',
    right: '22%',
    height: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  ponto: { width: 4, height: 4, borderRadius: 2 },
  marca: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
