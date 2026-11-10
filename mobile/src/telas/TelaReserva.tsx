// Tela de pagamento da reserva. Depois de pago mostra os ingressos.
// Usada pelo cliente e pela bilheteria.
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { Passe } from '@/components/Passe';
import { useCarregar } from '@/hooks/useCarregar';
import { useContagem } from '@/hooks/useContagem';
import type { Reserva } from '@/models/tipos';
import { ErroApi, mensagemDe } from '@/services/api';
import { reservaService } from '@/services/cineon';
import { Chegar } from '@/ui/animacoes';
import { Botao, Carregando, Linha, MensagemErro, Secao, Tela, Texto, TextoErro, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';
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
  const paleta = useTema();
  const margem = useMargem();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atual = reserva ?? vm.dados;
  const restante = useContagem(atual?.status === 'PENDENTE' ? atual.expiraEm : null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro || !atual) return <MensagemErro mensagem={vm.erro ?? 'Reserva não encontrada'} aoTentarDeNovo={vm.recarregar} />;

  const vencida = atual.status === 'EXPIRADA' || (atual.status === 'PENDENTE' && restante <= 0);
  const prazoTotal = new Date(atual.expiraEm).getTime() - new Date(atual.criadaEm).getTime();
  const fracao = Math.max(0, Math.min(1, restante / prazoTotal));
  const acabando = restante < 60_000;

  async function pagar() {
    setErro(null);
    setProcessando(true);
    try {
      setReserva(await reservaService.pagar(reservaId));
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if (e instanceof ErroApi && e.status === 410) vm.recarregarSilencioso();
      setErro(mensagemDe(e));
    } finally {
      setProcessando(false);
    }
  }

  async function desistir() {
    if (!(await confirmar('Desistir da reserva?', 'Os lugares voltam a ficar livres para outras pessoas.', 'Desistir', true))) return;
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
        <Stack.Screen options={{ title: '', headerBackVisible: false, gestureEnabled: false }} />
        <Tela rodape={<Botao titulo={acaoFinal.titulo} aoTocar={acaoFinal.aoTocar} />}>
          {/* o check aparece primeiro, depois o texto, e por fim o ingresso chega, como na Wallet */}
          <View style={estilos.sucesso}>
            <Chegar escalaInicial={0.4} deslocamento={0}>
              <Ionicons name="checkmark-circle" size={64} color={paleta.verde} />
            </Chegar>
            <Chegar atraso={120} deslocamento={10} style={{ alignItems: 'center', gap: espaco.xs }}>
              <Texto tipo="titulo1" style={{ textAlign: 'center' }}>
                Compra confirmada
              </Texto>
              <Texto tipo="subtitulo" cor="secundario" style={{ textAlign: 'center' }}>
                {atual.ingressos.length === 1 ? 'Seu ingresso está pronto.' : `Seus ${atual.ingressos.length} ingressos estão prontos.`} Total pago {dinheiro(atual.valorTotal)}.
              </Texto>
            </Chegar>
          </View>
          <Chegar atraso={280} deslocamento={72} escalaInicial={0.94} style={{ paddingHorizontal: margem }}>
            <Passe
              filme={atual.sessao.filme.titulo}
              filmeId={atual.sessao.filme.id}
              inicio={atual.sessao.inicio}
              sala={atual.sessao.sala.nome}
              itens={atual.ingressos}
              corFundo={paleta.fundo}
            />
          </Chegar>
        </Tela>
      </>
    );
  }

  if (vencida || atual.status === 'CANCELADA') {
    return (
      <Tela>
        <Stack.Screen options={{ title: '' }} />
        <Vazio
          icone={atual.status === 'CANCELADA' ? 'close-circle-outline' : 'timer-outline'}
          titulo={atual.status === 'CANCELADA' ? 'Reserva cancelada' : 'O tempo para pagar acabou'}
          texto="Os lugares foram liberados. Escolha de novo para continuar a compra."
          acao={<Botao titulo="Escolher lugares" variante="tingido" compacto aoTocar={() => aoVoltarAoMapa(atual.sessao.id)} />}
        />
      </Tela>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Pagamento' }} />
      <Tela
        rodape={
          <>
            <TextoErro texto={erro} />
            <Botao
              titulo={`Pagar ${dinheiro(atual.valorTotal)}`}
              aoTocar={pagar}
              carregando={processando}
            />
            <Botao titulo="Desistir da reserva" variante="destrutivo" compacto aoTocar={desistir} desabilitado={processando} />
          </>
        }>
        <View style={[estilos.prazo, { marginHorizontal: margem }]}>
          <View style={estilos.prazoLinha}>
            <Ionicons name="time-outline" size={18} color={acabando ? paleta.laranja : paleta.rotuloSecundario} />
            <Texto tipo="subtitulo" cor="secundario" style={{ flex: 1 }}>
              Lugares guardados por
            </Texto>
            <Texto tipo="titulo3" cor={acabando ? 'laranja' : 'rotulo'} style={{ fontVariant: ['tabular-nums'] }}>
              {minutosESegundos(restante)}
            </Texto>
          </View>
          <View style={[estilos.trilho, { backgroundColor: paleta.preenchimento }]}>
            <View style={[estilos.progresso, { width: `${fracao * 100}%`, backgroundColor: acabando ? paleta.laranja : paleta.azul }]} />
          </View>
        </View>

        <View style={[estilos.filme, { paddingHorizontal: margem }]}>
          <Arte titulo={atual.sessao.filme.titulo} id={atual.sessao.filme.id} poster={atual.sessao.filme.posterUrl} estilo={{ width: 84 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto tipo="titulo3" numberOfLines={3}>
              {atual.sessao.filme.titulo}
            </Texto>
            <Texto tipo="subtitulo" cor="secundario">
              {dataHora(atual.sessao.inicio)}
            </Texto>
            <Texto tipo="subtitulo" cor="secundario">
              {atual.sessao.sala.nome}
            </Texto>
          </View>
        </View>

        <Secao>
          {atual.nomeCliente ? <Linha titulo="Cliente" valor={atual.nomeCliente} /> : null}
          <Linha titulo="Lugares" valor={atual.assentos.map((a) => a.rotulo).join(', ')} />
          <Linha
            titulo={`${atual.assentos.length} × ingresso`}
            valor={dinheiro(atual.sessao.preco)}
          />
          <Linha titulo="Total" direita={<Texto tipo="destaque">{dinheiro(atual.valorTotal)}</Texto>} ultima />
        </Secao>
        <Texto tipo="nota" cor="secundario" style={estilos.nota}>
          Pagamento simulado para o trabalho acadêmico. Nenhum dado de cartão é pedido.
        </Texto>
      </Tela>
    </>
  );
}

const estilos = StyleSheet.create({
  sucesso: { alignItems: 'center', gap: espaco.s, paddingHorizontal: espaco.xxl, marginTop: espaco.l, marginBottom: espaco.xxl },
  prazo: { marginBottom: espaco.xxl, gap: espaco.s, marginTop: espaco.s },
  prazoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: espaco.xs },
  trilho: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progresso: { height: 4, borderRadius: 2 },
  filme: { flexDirection: 'row', gap: espaco.l, marginBottom: espaco.xxl, alignItems: 'center' },
  nota: { marginHorizontal: espaco.xxl, textAlign: 'center' },
});
