// Usada no app do cliente e na venda do balcão (que pede o nome do cliente).
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { MapaAssentos } from '@/components/MapaAssentos';
import { useAgora } from '@/hooks/useContagem';
import { MAX_ASSENTOS, useMapaAssentos } from '@/hooks/useMapaAssentos';
import { Pulso } from '@/ui/animacoes';
import { Botao, Campo, Carregando, MensagemErro, Secao, Tela, Texto, TextoErro } from '@/ui/componentes';
import { espaco, useMargem } from '@/ui/tema';
import { dataHora, dinheiro } from '@/utils/formatar';

type Props = {
  sessaoId: number;
  balcao?: boolean;
  aoReservar: (reservaId: number) => void;
};

export function TelaMapaSessao({ sessaoId, balcao = false, aoReservar }: Props) {
  const vm = useMapaAssentos(sessaoId);
  const margem = useMargem();
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
      <Stack.Screen options={{ title: balcao ? 'Venda no balcão' : 'Escolha os lugares' }} />
      <Tela
        aoAtualizar={vm.recarregar}
        atualizando={vm.atualizando}
        rodape={
          <>
            <TextoErro texto={erro} />
            <View style={estilos.resumo}>
              <View style={{ flex: 1 }}>
                <Texto tipo="destaque">
                  {quantidade === 0 ? 'Escolha seus lugares' : quantidade === 1 ? '1 lugar' : `${quantidade} lugares`}
                </Texto>
                <Texto tipo="nota" cor="secundario" numberOfLines={1}>
                  {quantidade === 0 ? `Até ${MAX_ASSENTOS} por compra` : vm.rotulos.join(', ')}
                </Texto>
              </View>
              {quantidade > 0 ? (
                <Pulso chave={quantidade} intensidade={1.1}>
                  <Texto tipo="titulo3" style={{ fontVariant: ['tabular-nums'] }}>
                    {dinheiro(sessao.preco * quantidade)}
                  </Texto>
                </Pulso>
              ) : null}
            </View>
            <Botao
              titulo={comecou ? 'Sessão já começou' : 'Reservar'}
              aoTocar={reservar}
              carregando={vm.reservando}
              desabilitado={quantidade === 0 || comecou}
            />
          </>
        }>
        <View style={[estilos.cabecalho, { paddingHorizontal: margem }]}>
          <Arte titulo={sessao.filme.titulo} id={sessao.filme.id} poster={sessao.filme.posterUrl} mini />
          <View style={{ flex: 1 }}>
            <Texto tipo="destaque" numberOfLines={1}>
              {sessao.filme.titulo}
            </Texto>
            <Texto tipo="subtitulo" cor="secundario" numberOfLines={1}>
              {dataHora(sessao.inicio)}, {sessao.sala.nome}
            </Texto>
          </View>
          <Texto tipo="nota" cor="secundario" style={{ textAlign: 'right' }}>
            {resumo.livres} livres
          </Texto>
        </View>

        <MapaAssentos mapa={vm.dados} selecionados={vm.selecionados} aoTocar={vm.alternar} />

        {balcao ? (
          <Secao estilo={{ marginTop: espaco.xxl }} nota="Opcional. Ajuda a encontrar a venda depois.">
            <Campo rotulo="Cliente" value={nomeCliente} onChangeText={setNomeCliente} placeholder="Nome de quem compra" ultima />
          </Secao>
        ) : null}
      </Tela>
    </>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, marginTop: espaco.s, marginBottom: espaco.xxl },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, marginBottom: espaco.xs },
});
