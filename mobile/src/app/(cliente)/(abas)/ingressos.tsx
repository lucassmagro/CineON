import { StyleSheet, Text, View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { useAgora } from '@/hooks/useContagem';
import type { Ingresso } from '@/models/tipos';
import { ingressoService } from '@/services/cineon';
import { Carregando, Etiqueta, Grupo, MensagemErro, Tela, TituloGrande, Vazio } from '@/ui/componentes';
import { cores, espaco, fonte } from '@/ui/tema';
import { dataHora, hora } from '@/utils/formatar';

export default function MeusIngressos() {
  const vm = useCarregar(ingressoService.meus);
  const agora = useAgora(60_000);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  const todos = vm.dados ?? [];
  const proximos = todos
    .filter((i) => new Date(i.sessao.fim).getTime() > agora)
    .sort((a, b) => a.sessao.inicio.localeCompare(b.sessao.inicio));
  const anteriores = todos.filter((i) => new Date(i.sessao.fim).getTime() <= agora);

  return (
    <Tela semCabecalho aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <TituloGrande texto="Ingressos" />
      {todos.length === 0 ? <Vazio texto="Você ainda não comprou ingressos." /> : null}

      {proximos.length > 0 ? (
        <Grupo titulo="Próximos" nota="Apresente o código na entrada da sala.">
          {proximos.map((i, indice) => (
            <CartaoIngresso key={i.codigo} ingresso={i} ultimo={indice === proximos.length - 1} />
          ))}
        </Grupo>
      ) : null}

      {anteriores.length > 0 ? (
        <Grupo titulo="Anteriores">
          {anteriores.map((i, indice) => (
            <CartaoIngresso key={i.codigo} ingresso={i} ultimo={indice === anteriores.length - 1} />
          ))}
        </Grupo>
      ) : null}
    </Tela>
  );
}

function CartaoIngresso({ ingresso: i, ultimo }: { ingresso: Ingresso; ultimo: boolean }) {
  const etiqueta =
    i.status === 'UTILIZADO'
      ? { texto: `Utilizado ${i.utilizadoEm ? hora(i.utilizadoEm) : ''}`, cor: cores.textoSecundario, fundo: cores.separador }
      : i.status === 'CANCELADO'
        ? { texto: 'Cancelado', cor: cores.vermelho, fundo: cores.vermelhoClaro }
        : { texto: 'Válido', cor: cores.verde, fundo: cores.verdeClaro };
  return (
    <View style={[estilos.cartao, !ultimo && estilos.separado]}>
      <View style={estilos.topo}>
        <Text style={[fonte.subtitulo, { flex: 1 }]} numberOfLines={1}>
          {i.sessao.filme.titulo}
        </Text>
        <Etiqueta {...etiqueta} />
      </View>
      <Text style={estilos.detalhe}>
        {dataHora(i.sessao.inicio)} · {i.sessao.sala.nome} · Assento {i.assento}
      </Text>
      <Text style={[estilos.codigo, i.status !== 'VALIDO' && { color: cores.textoSecundario }]} selectable>
        {i.codigo}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { padding: espaco.l, gap: 6 },
  separado: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.separador },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  detalhe: { ...fonte.secundario, color: cores.textoSecundario },
  codigo: { ...fonte.mono, fontSize: 22, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
});
