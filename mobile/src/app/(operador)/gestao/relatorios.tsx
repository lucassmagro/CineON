import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { useCarregar } from '@/hooks/useCarregar';
import { relatorioService } from '@/services/cineon';
import { Carregando, Linha, MensagemErro, Secao, Segmentos, Tela, Texto, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema, type Paleta } from '@/ui/tema';
import { chaveDia, dataHora, dinheiro } from '@/utils/formatar';

const LIMITE_SESSOES = 8;

type Periodo = 'hoje' | 'ult7' | 'prox7' | 'ult30';

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'ult7', rotulo: '7 dias' },
  { valor: 'ult30', rotulo: '30 dias' },
  { valor: 'prox7', rotulo: 'Próximos 7' },
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

const porcento = (n: number) => `${n.toFixed(n >= 10 || n === 0 ? 0 : 1)}%`;

export default function Relatorios() {
  const c = useTema();
  const margem = useMargem();
  const [periodo, setPeriodo] = useState<Periodo>('ult7');
  const [todasSessoes, setTodasSessoes] = useState(false);
  const vm = useCarregar(async () => {
    const { inicio, fim } = intervalo(periodo);
    const [ocupacao, vendas] = await Promise.all([relatorioService.ocupacao(inicio, fim), relatorioService.vendas(inicio, fim)]);
    return { ocupacao, vendas };
  }, [periodo]);

  const app = vm.dados?.vendas.porCanal.find((x) => x.canal === 'ONLINE');
  const balcao = vm.dados?.vendas.porCanal.find((x) => x.canal === 'BALCAO');
  const totalCanais = (app?.valor ?? 0) + (balcao?.valor ?? 0);

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xl }}>
        <Segmentos opcoes={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
      </View>

      {vm.carregando ? <Carregando /> : null}
      {vm.erro ? <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} /> : null}

      {vm.dados && !vm.carregando ? (
        <>
          <View style={[estilos.resumo, { backgroundColor: c.fundoElevado, marginHorizontal: margem }]}>
            <Texto tipo="subtitulo" cor="secundario">
              Receita
            </Texto>
            <Texto tipo="tituloGrande" style={{ fontVariant: ['tabular-nums'] }}>
              {dinheiro(vm.dados.vendas.receitaTotal)}
            </Texto>
            <View style={estilos.numeros}>
              <Numero valor={String(vm.dados.vendas.ingressosVendidos)} rotulo="ingressos vendidos" />
              <Numero valor={porcento(vm.dados.ocupacao.totais.taxaOcupacao)} rotulo="de ocupação média" />
              <Numero valor={String(vm.dados.ocupacao.totais.sessoes)} rotulo="sessões" />
            </View>
          </View>

          {totalCanais > 0 ? (
            <Secao titulo="Onde as vendas aconteceram">
              <View style={{ padding: espaco.l, gap: espaco.m }}>
                <View style={[estilos.trilho, { backgroundColor: c.preenchimento }]}>
                  <View style={{ flex: app?.valor ?? 0, backgroundColor: c.azul }} />
                  <View style={{ flex: balcao?.valor ?? 0, backgroundColor: c.laranja }} />
                </View>
                <Canal cor={c.azul} nome="Aplicativo" valor={app?.valor ?? 0} compras={app?.reservas ?? 0} total={totalCanais} />
                <Canal cor={c.laranja} nome="Balcão" valor={balcao?.valor ?? 0} compras={balcao?.reservas ?? 0} total={totalCanais} />
              </View>
            </Secao>
          ) : null}

          <Secao titulo="Por filme">
            {vm.dados.vendas.porFilme.length === 0 ? <Vazio icone="film-outline" titulo="Sem sessões no período" /> : null}
            {vm.dados.vendas.porFilme.map((f, i) => (
              <ItemBarra
                key={f.filmeId}
                filmeId={f.filmeId}
                titulo={f.filme}
                detalhe={`${f.ingressos} ingressos em ${f.sessoes} ${f.sessoes === 1 ? 'sessão' : 'sessões'}`}
                valor={dinheiro(f.receita)}
                fracao={f.taxaOcupacao / 100}
                rotuloFracao={porcento(f.taxaOcupacao)}
                paleta={c}
                ultimo={i === vm.dados!.vendas.porFilme.length - 1}
              />
            ))}
          </Secao>

          <Secao titulo="Ocupação por sessão">
            {vm.dados.ocupacao.sessoes.length === 0 ? <Vazio icone="calendar-outline" titulo="Sem sessões no período" /> : null}
            {(todasSessoes ? vm.dados.ocupacao.sessoes : vm.dados.ocupacao.sessoes.slice(0, LIMITE_SESSOES)).map((s, i, lista) => (
              <ItemBarra
                key={s.sessaoId}
                filmeId={s.filmeId}
                titulo={s.filme}
                detalhe={`${dataHora(s.inicio)}, ${s.sala}. ${s.vendidos} de ${s.capacidade} lugares`}
                valor={dinheiro(s.receita)}
                fracao={s.taxaOcupacao / 100}
                rotuloFracao={porcento(s.taxaOcupacao)}
                paleta={c}
                ultimo={i === lista.length - 1 && (todasSessoes || vm.dados!.ocupacao.sessoes.length <= LIMITE_SESSOES)}
              />
            ))}
            {!todasSessoes && vm.dados.ocupacao.sessoes.length > LIMITE_SESSOES ? (
              <Linha
                titulo={`Mostrar todas as ${vm.dados.ocupacao.sessoes.length} sessões`}
                corTitulo={c.azul}
                acessorio="nenhum"
                aoTocar={() => setTodasSessoes(true)}
                ultima
              />
            ) : null}
          </Secao>
        </>
      ) : null}
    </Tela>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Texto tipo="titulo2" style={{ fontVariant: ['tabular-nums'] }}>
        {valor}
      </Texto>
      <Texto tipo="nota" cor="secundario">
        {rotulo}
      </Texto>
    </View>
  );
}

function Canal({ cor, nome, valor, compras, total }: { cor: string; nome: string; valor: number; compras: number; total: number }) {
  return (
    <View style={estilos.canal}>
      <View style={[estilos.bolinha, { backgroundColor: cor }]} />
      <Texto style={{ flex: 1 }}>{nome}</Texto>
      <Texto tipo="subtitulo" cor="secundario">
        {compras} {compras === 1 ? 'compra' : 'compras'}
      </Texto>
      <Texto tipo="destaque" style={{ minWidth: 48, textAlign: 'right' }}>
        {porcento((valor / total) * 100)}
      </Texto>
    </View>
  );
}

function ItemBarra({
  filmeId,
  titulo,
  detalhe,
  valor,
  fracao,
  rotuloFracao,
  paleta,
  ultimo,
}: {
  filmeId: number;
  titulo: string;
  detalhe: string;
  valor: string;
  fracao: number;
  rotuloFracao: string;
  paleta: Paleta;
  ultimo: boolean;
}) {
  return (
    <View style={estilos.item}>
      <Arte titulo={titulo} id={filmeId} mini />
      <View style={[estilos.itemMeio, !ultimo && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: paleta.separador }]}>
        <View style={estilos.itemTopo}>
          <Texto tipo="subtitulo" peso="600" numberOfLines={1} style={{ flex: 1 }}>
            {titulo}
          </Texto>
          <Texto tipo="subtitulo">{valor}</Texto>
        </View>
        <Texto tipo="nota" cor="secundario" numberOfLines={1}>
          {detalhe}
        </Texto>
        <View style={estilos.itemBarra}>
          <View style={[estilos.trilhoFino, { backgroundColor: paleta.preenchimento }]}>
            <View style={{ width: `${Math.min(100, fracao * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: paleta.azul }} />
          </View>
          <Texto tipo="nota" peso="600" style={{ minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
            {rotuloFracao}
          </Texto>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  resumo: { borderRadius: 16, padding: espaco.xl, marginBottom: espaco.xxl, gap: 2 },
  numeros: { flexDirection: 'row', gap: espaco.m, marginTop: espaco.l },
  trilho: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  canal: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  item: { flexDirection: 'row', gap: espaco.m, paddingLeft: espaco.l, alignItems: 'center' },
  itemMeio: { flex: 1, paddingVertical: espaco.m, paddingRight: espaco.l, gap: 2 },
  itemTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  itemBarra: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, marginTop: 4 },
  trilhoFino: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
});

