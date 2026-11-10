import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { relatorioService } from '@/services/cineon';
import { Carregando, Grupo, Linha, MensagemErro, Segmentos, Tela, Vazio } from '@/ui/componentes';
import { cores, espaco, fonte } from '@/ui/tema';
import { chaveDia, dataHora, dinheiro } from '@/utils/formatar';

type Periodo = 'hoje' | 'ult7' | 'prox7' | 'ult30';

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'ult30', rotulo: '30 dias' },
  { valor: 'ult7', rotulo: '7 dias' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'prox7', rotulo: 'Próx. 7' },
];

function intervalo(p: Periodo): { inicio: string; fim: string } {
  const dia = 86_400_000;
  const meiaNoite = (deslocDias: number) => `${chaveDia(new Date(Date.now() + deslocDias * dia))}T00:00:00-03:00`;
  switch (p) {
    case 'hoje':
      return { inicio: meiaNoite(0), fim: meiaNoite(1) };
    case 'ult7':
      return { inicio: meiaNoite(-6), fim: meiaNoite(1) };
    case 'prox7':
      return { inicio: meiaNoite(0), fim: meiaNoite(7) };
    case 'ult30':
      return { inicio: meiaNoite(-29), fim: meiaNoite(1) };
  }
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('ult7');
  const vm = useCarregar(async () => {
    const { inicio, fim } = intervalo(periodo);
    const [ocupacao, vendas] = await Promise.all([relatorioService.ocupacao(inicio, fim), relatorioService.vendas(inicio, fim)]);
    return { ocupacao, vendas };
  }, [periodo]);

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <View style={{ paddingHorizontal: espaco.s }}>
        <Segmentos opcoes={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
      </View>

      {vm.carregando ? <Carregando /> : null}
      {vm.erro ? <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} /> : null}

      {vm.dados && !vm.carregando ? (
        <>
          <View style={estilos.cartoes}>
            <Indicador rotulo="Receita no período" valor={dinheiro(vm.dados.vendas.receitaTotal)} />
          </View>
          <View style={estilos.cartoes}>
            <Indicador rotulo="Ingressos vendidos" valor={String(vm.dados.vendas.ingressosVendidos)} />
            <Indicador rotulo="Ocupação média" valor={`${vm.dados.ocupacao.totais.taxaOcupacao.toFixed(1)}%`} />
          </View>

          <View style={{ height: espaco.l }} />
          <Grupo titulo="Por canal">
            {vm.dados.vendas.porCanal.length === 0 ? <Linha titulo="Sem vendas no período" ultima /> : null}
            {vm.dados.vendas.porCanal.map((c, i) => (
              <Linha
                key={c.canal}
                titulo={c.canal === 'ONLINE' ? 'Aplicativo' : 'Balcão'}
                subtitulo={`${c.reservas} compra(s)`}
                valor={dinheiro(c.valor)}
                ultima={i === vm.dados!.vendas.porCanal.length - 1}
              />
            ))}
          </Grupo>

          <Grupo titulo="Por filme">
            {vm.dados.vendas.porFilme.map((f, i) => (
              <Linha
                key={f.filmeId}
                titulo={f.filme}
                subtitulo={`${f.ingressos} ingressos · ${f.sessoes} sessões · ${f.taxaOcupacao.toFixed(1)}% ocupação`}
                valor={dinheiro(f.receita)}
                ultima={i === vm.dados!.vendas.porFilme.length - 1}
              />
            ))}
          </Grupo>

          <Grupo titulo={`Ocupação por sessão (${vm.dados.ocupacao.totais.sessoes})`}>
            {vm.dados.ocupacao.sessoes.length === 0 ? <Vazio texto="Nenhuma sessão no período." /> : null}
            {vm.dados.ocupacao.sessoes.map((s, i) => (
              <View key={s.sessaoId} style={[estilos.sessao, i < vm.dados!.ocupacao.sessoes.length - 1 && estilos.separado]}>
                <View style={estilos.linhaTopo}>
                  <Text style={[fonte.corpo, { flex: 1 }]} numberOfLines={1}>
                    {s.filme}
                  </Text>
                  <Text style={fonte.subtitulo}>{s.taxaOcupacao.toFixed(0)}%</Text>
                </View>
                <Text style={estilos.detalhe}>
                  {dataHora(s.inicio)} · {s.sala} · {s.vendidos}/{s.capacidade} · {dinheiro(s.receita)}
                </Text>
                <View style={estilos.barraFundo}>
                  <View style={[estilos.barra, { width: `${Math.min(100, s.taxaOcupacao)}%` }]} />
                </View>
              </View>
            ))}
          </Grupo>
        </>
      ) : null}
    </Tela>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.indicador}>
      <Text style={estilos.detalhe}>{rotulo}</Text>
      <Text style={estilos.valorIndicador}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartoes: { flexDirection: 'row', gap: espaco.s, paddingHorizontal: espaco.l, marginBottom: espaco.s },
  indicador: { flex: 1, backgroundColor: cores.cartao, borderRadius: 12, padding: espaco.m, gap: 2 },
  valorIndicador: { fontSize: 20, fontWeight: '700' },
  sessao: { padding: espaco.l, gap: 4 },
  separado: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.separador },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  detalhe: { ...fonte.rodape, color: cores.textoSecundario },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: cores.separador, marginTop: 4, overflow: 'hidden' },
  barra: { height: 6, borderRadius: 3, backgroundColor: cores.azul },
});
