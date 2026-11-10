// Tela de pagamento da reserva. Depois de pago mostra os códigos dos ingressos.
// Usada pelo cliente e pela bilheteria.
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { useContagem } from '@/hooks/useContagem';
import type { Reserva } from '@/models/tipos';
import { ErroApi, mensagemDe } from '@/services/api';
import { reservaService } from '@/services/cineon';
import { Botao, Carregando, Grupo, Linha, MensagemErro, Tela, TextoErro } from '@/ui/componentes';
import { cores, espaco, fonte, raio } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';
import { dataHora, dinheiro, minutosESegundos } from '@/utils/formatar';

type Props = {
  reservaId: number;
  // botão que aparece depois de pago
  acaoFinal: { titulo: string; aoTocar: () => void };
  aoVoltarAoMapa: (sessaoId: number) => void;
};

export function TelaReserva({ reservaId, acaoFinal, aoVoltarAoMapa }: Props) {
  const vm = useCarregar(() => reservaService.buscar(reservaId), [reservaId]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atual = reserva ?? vm.dados;
  const restante = useContagem(atual?.status === 'PENDENTE' ? atual.expiraEm : null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !atual) return <MensagemErro mensagem={vm.erro ?? 'Reserva não encontrada'} aoTentarDeNovo={vm.recarregar} />;

  const vencida = atual.status === 'EXPIRADA' || (atual.status === 'PENDENTE' && restante <= 0);

  async function pagar() {
    setErro(null);
    setProcessando(true);
    try {
      setReserva(await reservaService.pagar(reservaId));
    } catch (e) {
      if (e instanceof ErroApi && e.status === 410) vm.recarregarSilencioso();
      setErro(mensagemDe(e));
    } finally {
      setProcessando(false);
    }
  }

  async function desistir() {
    if (!(await confirmar('Desistir da reserva?', 'Os assentos serão liberados para outras pessoas.', 'Desistir', true))) return;
    try {
      await reservaService.desistir(reservaId);
      aoVoltarAoMapa(atual!.sessao.id);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  // já pago: mostra os ingressos
  if (atual.status === 'PAGA') {
    return (
      <>
        <Stack.Screen options={{ title: 'Ingressos', headerBackVisible: false, gestureEnabled: false }} />
        <Tela rodape={<Botao titulo={acaoFinal.titulo} aoTocar={acaoFinal.aoTocar} />}>
          <View style={estilos.sucesso}>
            <Text style={estilos.check}>✓</Text>
            <Text style={fonte.titulo}>Pagamento confirmado</Text>
            <Text style={estilos.detalhe}>
              {atual.sessao.filme.titulo} · {dataHora(atual.sessao.inicio)} · {atual.sessao.sala.nome}
            </Text>
          </View>
          <Grupo titulo="Ingressos" nota="Apresente o código na entrada da sala.">
            {atual.ingressos.map((i, indice) => (
              <View key={i.codigo} style={[estilos.ingresso, indice < atual.ingressos.length - 1 && estilos.separado]}>
                <Text style={estilos.assento}>Assento {i.assento}</Text>
                <Text style={estilos.codigo} selectable>
                  {i.codigo}
                </Text>
              </View>
            ))}
          </Grupo>
          <Grupo>
            <Linha titulo="Total pago" valor={dinheiro(atual.valorTotal)} ultima />
          </Grupo>
        </Tela>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Pagamento' }} />
      <Tela
        rodape={
          vencida || atual.status === 'CANCELADA' ? (
            <Botao titulo="Escolher assentos novamente" aoTocar={() => aoVoltarAoMapa(atual.sessao.id)} />
          ) : (
            <>
              <TextoErro texto={erro} />
              <Botao titulo={`Pagar ${dinheiro(atual.valorTotal)}`} aoTocar={pagar} carregando={processando} />
              <Botao titulo="Desistir" tipo="destrutivo" aoTocar={desistir} desabilitado={processando} />
            </>
          )
        }>
        {vencida || atual.status === 'CANCELADA' ? (
          <View style={[estilos.aviso, { backgroundColor: cores.vermelhoClaro }]}>
            <Text style={[fonte.subtitulo, { color: cores.vermelho }]}>
              {atual.status === 'CANCELADA' ? 'Reserva cancelada' : 'O tempo para pagar acabou'}
            </Text>
            <Text style={estilos.detalhe}>Os assentos foram liberados. Escolha novamente.</Text>
          </View>
        ) : (
          <View style={[estilos.aviso, { backgroundColor: restante < 60_000 ? cores.laranjaClaro : cores.azulClaro }]}>
            <Text style={estilos.detalhe}>Tempo para pagar</Text>
            <Text style={[estilos.relogio, restante < 60_000 && { color: cores.laranja }]}>{minutosESegundos(restante)}</Text>
          </View>
        )}

        <Grupo titulo="Resumo">
          <Linha titulo="Filme" valor={atual.sessao.filme.titulo} />
          <Linha titulo="Sessão" valor={dataHora(atual.sessao.inicio)} />
          <Linha titulo="Sala" valor={atual.sessao.sala.nome} />
          <Linha titulo="Assentos" valor={atual.assentos.map((a) => a.rotulo).join(', ')} />
          {atual.nomeCliente ? <Linha titulo="Cliente" valor={atual.nomeCliente} /> : null}
          <Linha titulo="Total" valor={dinheiro(atual.valorTotal)} ultima />
        </Grupo>
        <Text style={estilos.nota}>Pagamento simulado para fins acadêmicos: nenhum dado de cartão é solicitado.</Text>
      </Tela>
    </>
  );
}

const estilos = StyleSheet.create({
  sucesso: { alignItems: 'center', gap: espaco.s, paddingHorizontal: espaco.xl, marginBottom: espaco.xl },
  check: { fontSize: 44, color: cores.verde, fontWeight: '700' },
  detalhe: { ...fonte.secundario, color: cores.textoSecundario, textAlign: 'center' },
  ingresso: { padding: espaco.l, gap: 4, alignItems: 'center' },
  separado: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.separador },
  assento: { ...fonte.secundario, color: cores.textoSecundario },
  codigo: { ...fonte.mono, fontSize: 26, fontWeight: '700', letterSpacing: 3 },
  aviso: { marginHorizontal: espaco.l, marginBottom: espaco.xl, borderRadius: raio.medio, padding: espaco.l, alignItems: 'center', gap: 4 },
  relogio: { ...fonte.mono, fontSize: 40, fontWeight: '700', color: cores.azul },
  nota: { ...fonte.rodape, color: cores.textoSecundario, textAlign: 'center', marginHorizontal: espaco.xl },
});
