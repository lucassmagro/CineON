// Usada no app do cliente e na venda do balcão (que pede o nome do cliente).
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MapaAssentos } from '@/components/MapaAssentos';
import { useAgora } from '@/hooks/useContagem';
import { MAX_ASSENTOS, useMapaAssentos } from '@/hooks/useMapaAssentos';
import { Botao, Campo, Carregando, Grupo, MensagemErro, Tela, TextoErro } from '@/ui/componentes';
import { cores, espaco, fonte } from '@/ui/tema';
import { dataHora, dinheiro } from '@/utils/formatar';

type Props = {
  sessaoId: number;
  balcao?: boolean;
  aoReservar: (reservaId: number) => void;
};

export function TelaMapaSessao({ sessaoId, balcao = false, aoReservar }: Props) {
  const vm = useMapaAssentos(sessaoId);
  const agora = useAgora(15_000);
  const [nomeCliente, setNomeCliente] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !vm.dados) return <MensagemErro mensagem={vm.erro ?? 'Sessão não encontrada'} aoTentarDeNovo={vm.recarregar} />;

  const { sessao, resumo } = vm.dados;
  const quantidade = vm.selecionados.length;
  const comecou = new Date(sessao.inicio).getTime() <= agora;

  async function reservar() {
    setErro(null);
    const resultado = await vm.reservar(balcao ? nomeCliente.trim() || undefined : undefined);
    if (resultado.reservaId) aoReservar(resultado.reservaId);
    else setErro(resultado.erro ?? 'Não foi possível reservar');
  }

  return (
    <>
      <Stack.Screen options={{ title: sessao.filme.titulo }} />
      <Tela
        aoAtualizar={vm.recarregar}
        atualizando={vm.atualizando}
        rodape={
          <>
            <TextoErro texto={erro} />
            <View style={estilos.resumoSelecao}>
              <Text style={fonte.secundario}>
                {quantidade === 0 ? 'Toque nos assentos livres' : `${quantidade} assento(s): ${vm.rotulos.join(', ')}`}
              </Text>
              {quantidade > 0 ? <Text style={fonte.subtitulo}>{dinheiro(sessao.preco * quantidade)}</Text> : null}
            </View>
            <Botao
              titulo={balcao ? 'Reservar para venda' : 'Reservar assentos'}
              aoTocar={reservar}
              carregando={vm.reservando}
              desabilitado={quantidade === 0 || comecou}
            />
          </>
        }>
        <Grupo>
          <View style={estilos.cabecalho}>
            <Text style={fonte.subtitulo}>{sessao.filme.titulo}</Text>
            <Text style={estilos.detalhe}>
              {dataHora(sessao.inicio)} · {sessao.sala.nome} · {dinheiro(sessao.preco)}
            </Text>
            <Text style={estilos.detalhe}>
              {resumo.livres} livres de {resumo.capacidade}
            </Text>
          </View>
        </Grupo>

        {comecou ? <TextoErro texto="Esta sessão já começou; não é mais possível reservar." /> : null}

        <MapaAssentos mapa={vm.dados} selecionados={vm.selecionados} aoTocar={vm.alternar} />

        <Text style={estilos.nota}>
          Até {MAX_ASSENTOS} assentos por compra. Os assentos ficam reservados por alguns minutos enquanto você paga.
        </Text>

        {balcao ? (
          <View style={{ marginTop: espaco.xl }}>
            <Grupo titulo="Venda no balcão" nota="Opcional: ajuda a identificar a venda.">
              <Campo rotulo="Nome do cliente" value={nomeCliente} onChangeText={setNomeCliente} placeholder="Ex.: Maria" ultima />
            </Grupo>
          </View>
        ) : null}
      </Tela>
    </>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { padding: espaco.l, gap: 4 },
  detalhe: { ...fonte.secundario, color: cores.textoSecundario },
  resumoSelecao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nota: { ...fonte.rodape, color: cores.textoSecundario, textAlign: 'center', marginTop: espaco.l, marginHorizontal: espaco.xl },
});
