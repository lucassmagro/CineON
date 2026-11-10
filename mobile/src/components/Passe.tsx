// Passe da sessão, no estilo da Wallet: um por sessão, com o código de cada lugar.
// Recolhido, mostra só o cabeçalho, como os passes empilhados na Wallet.
import { StyleSheet, Text, View } from 'react-native';

import type { StatusIngresso } from '@/models/tipos';
import { EmSequencia, Expandir } from '@/ui/animacoes';
import { corDoFilme } from '@/ui/arteFilme';
import { fonteCodigo, tipos } from '@/ui/tema';
import { Tocavel } from '@/ui/Tocavel';
import { diaAmigavel, hora } from '@/utils/formatar';

export type ItemPasse = { assento: string; codigo: string; status: StatusIngresso; utilizadoEm?: string | null };

type Props = {
  filme: string;
  filmeId?: number;
  inicio: string;
  sala: string;
  itens: ItemPasse[];
  // cor atrás do passe, usada nos recortes do picote
  corFundo: string;
  recolhido?: boolean;
  aoTocar?: () => void;
};

export function Passe({ filme, filmeId, inicio, sala, itens, corFundo, recolhido = false, aoTocar }: Props) {
  const fundo = corDoFilme(filme, filmeId);
  const lugares = itens.map((i) => i.assento).join(', ');
  const todosUsados = itens.every((i) => i.status !== 'VALIDO');
  const quantidade = itens.length === 1 ? '1 ingresso' : `${itens.length} ingressos`;

  const conteudo = (
    <View style={[estilos.passe, { backgroundColor: fundo }, todosUsados && { opacity: 0.55 }]}>
      <View style={estilos.topo}>
        <Text style={[tipos.destaque, estilos.marca]}>CineON</Text>
        <Text style={[tipos.subtitulo, estilos.claro]}>{recolhido ? `${diaAmigavel(inicio)}, ${hora(inicio)}` : diaAmigavel(inicio)}</Text>
      </View>

      {/* as duas versões ficam montadas: uma encolhe enquanto a outra cresce */}
      <Expandir aberto={recolhido}>
        <View style={estilos.recolhido}>
          <Text style={[tipos.titulo3, estilos.branco, { flex: 1 }]} numberOfLines={1}>
            {filme}
          </Text>
          <Text style={[tipos.subtitulo, estilos.claro]}>{quantidade}</Text>
        </View>
      </Expandir>

      <Expandir aberto={!recolhido}>
        <Text style={[tipos.titulo1, estilos.branco, estilos.titulo]} numberOfLines={2}>
          {filme}
        </Text>

        <View style={estilos.campos}>
          <Campo rotulo="Sala" valor={sala} />
          <Campo rotulo={itens.length === 1 ? 'Lugar' : 'Lugares'} valor={lugares} largo />
          <Campo rotulo="Horário" valor={hora(inicio)} alinharFim />
        </View>

        <View style={estilos.picote}>
          <View style={[estilos.recorte, estilos.recorteEsq, { backgroundColor: corFundo }]} />
          <View style={estilos.tracejado} />
          <View style={[estilos.recorte, estilos.recorteDir, { backgroundColor: corFundo }]} />
        </View>

        {itens.length === 1 ? (
          <EmSequencia indice={0} visivel={!recolhido}>
            <View style={estilos.unico}>
              <Text style={[tipos.legenda, estilos.claro]}>{legendaStatus(itens[0]!)}</Text>
              <Text style={[fonteCodigo, estilos.codigoGrande]} selectable>
                {itens[0]!.codigo}
              </Text>
            </View>
          </EmSequencia>
        ) : (
          <View style={estilos.lista}>
            <Text style={[tipos.legenda, estilos.claro, { marginBottom: 4 }]}>Apresente o código de cada lugar na entrada</Text>
            {itens.map((i, indice) => (
              <EmSequencia key={i.codigo} indice={indice} visivel={!recolhido}>
                <View style={[estilos.item, indice > 0 && estilos.itemBorda, i.status !== 'VALIDO' && { opacity: 0.5 }]}>
                  <Text style={[tipos.destaque, estilos.branco, { width: 52 }]}>{i.assento}</Text>
                  <Text style={[fonteCodigo, estilos.codigo]} selectable>
                    {i.codigo}
                  </Text>
                  {i.status !== 'VALIDO' ? <Text style={[tipos.legenda, estilos.claro]}>{i.status === 'UTILIZADO' ? 'usado' : 'cancelado'}</Text> : null}
                </View>
              </EmSequencia>
            ))}
          </View>
        )}
      </Expandir>
    </View>
  );

  // as props do envoltório não mudam quando o passe abre: na Web, mudar o papel ou a escala
  // recriava o elemento e o passe pulava pro tamanho final sem animar
  const descricao = `Ingressos de ${filme}, ${sala}, ${quantidade}`;
  return (
    <Tocavel
      onPress={aoTocar}
      disabled={!aoTocar}
      escala={0.98}
      escalaHover={1.01}
      accessibilityRole="button"
      accessibilityState={{ expanded: !recolhido, disabled: !aoTocar }}
      accessibilityLabel={descricao}>
      {conteudo}
    </Tocavel>
  );
}

function legendaStatus(i: ItemPasse): string {
  if (i.status === 'UTILIZADO') return `Utilizado${i.utilizadoEm ? ` às ${hora(i.utilizadoEm)}` : ''}`;
  if (i.status === 'CANCELADO') return 'Cancelado';
  return 'Apresente este código na entrada';
}

function Campo({ rotulo, valor, alinharFim = false, largo = false }: { rotulo: string; valor: string; alinharFim?: boolean; largo?: boolean }) {
  return (
    <View style={{ flex: largo ? 1.4 : 1, alignItems: alinharFim ? 'flex-end' : 'flex-start' }}>
      <Text style={[tipos.legenda, estilos.claro]}>{rotulo}</Text>
      <Text style={[tipos.titulo3, estilos.branco, { fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

const RECORTE = 22;

const estilos = StyleSheet.create({
  passe: { borderRadius: 18, overflow: 'hidden', paddingTop: 16 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  marca: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.3 },
  branco: { color: '#FFFFFF' },
  claro: { color: 'rgba(255,255,255,0.72)' },
  recolhido: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  titulo: { paddingHorizontal: 20, marginTop: 16, letterSpacing: -0.5 },
  campos: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 18, marginBottom: 18 },
  picote: { height: RECORTE, justifyContent: 'center' },
  tracejado: { marginHorizontal: RECORTE / 2 + 6, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
  recorte: { position: 'absolute', width: RECORTE, height: RECORTE, borderRadius: RECORTE / 2, top: 0 },
  recorteEsq: { left: -RECORTE / 2 },
  recorteDir: { right: -RECORTE / 2 },
  unico: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22, alignItems: 'center', gap: 6 },
  codigoGrande: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: 5 },
  lista: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemBorda: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.25)' },
  codigo: { color: '#FFFFFF', fontSize: 19, fontWeight: '600', letterSpacing: 3, flex: 1 },
});
