// Cancelar ingressos de uma sessão: escolhe os lugares, vê o estorno e confirma.
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { Arte } from '@/components/Arte';
import { useCarregar } from '@/hooks/useCarregar';
import { useAgora } from '@/hooks/useContagem';
import { mensagemDe } from '@/services/api';
import { CANCELAMENTO_MINUTOS, ingressoService } from '@/services/cineon';
import { Pulso } from '@/ui/animacoes';
import { Botao, Carregando, Linha, MensagemErro, Secao, Tela, Texto, TextoErro, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';
import { dataHora, dinheiro } from '@/utils/formatar';

export default function CancelarIngressos() {
  const { sessaoId } = useLocalSearchParams<{ sessaoId: string }>();
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const agora = useAgora(30_000);
  const vm = useCarregar(ingressoService.meus);
  // null enquanto a pessoa não mexeu: aí só vem marcado se for um ingresso só
  const [marcados, setMarcados] = useState<string[] | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  const ingressos = (vm.dados ?? [])
    .filter((i) => i.sessao.id === Number(sessaoId) && i.status === 'VALIDO')
    .sort((a, b) => a.assento.localeCompare(b.assento, 'pt-BR', { numeric: true }));
  const sessao = ingressos[0]?.sessao;

  if (!sessao) {
    return (
      <Tela>
        <Vazio icone="ticket-outline" titulo="Nada para cancelar" texto="Os ingressos desta sessão já foram usados ou cancelados." />
      </Tela>
    );
  }

  const limite = new Date(sessao.inicio).getTime() - CANCELAMENTO_MINUTOS * 60_000;
  if (agora > limite) {
    return (
      <Tela>
        <Vazio
          icone="time-outline"
          titulo="Prazo encerrado"
          texto={`O cancelamento vai até ${CANCELAMENTO_MINUTOS} minutos antes do início da sessão.`}
          acao={<Botao titulo="Voltar aos ingressos" variante="tingido" compacto aoTocar={() => router.back()} />}
        />
      </Tela>
    );
  }

  // ação destrutiva: com vários lugares começa sem nada marcado
  const selecao = marcados ?? (ingressos.length === 1 ? [ingressos[0]!.codigo] : []);
  const escolhidos = ingressos.filter((i) => selecao.includes(i.codigo));
  const todosMarcados = escolhidos.length === ingressos.length;
  const estorno = escolhidos.reduce((soma, i) => soma + i.valor, 0);
  const n = escolhidos.length;
  const rotuloBotao = n === 0 ? 'Escolha um lugar' : n === 1 ? 'Cancelar 1 ingresso' : `Cancelar ${n} ingressos`;

  function alternar(codigo: string) {
    setMarcados(selecao.includes(codigo) ? selecao.filter((x) => x !== codigo) : [...selecao, codigo]);
  }

  function alternarTodos() {
    setMarcados(todosMarcados ? [] : ingressos.map((i) => i.codigo));
  }

  async function cancelar() {
    const lugares = escolhidos.map((i) => i.assento).join(', ');
    const ok = await confirmar(
      n === 1 ? 'Cancelar o ingresso?' : `Cancelar ${n} ingressos?`,
      `${n === 1 ? 'O lugar' : 'Os lugares'} ${lugares} ${n === 1 ? 'volta a ficar livre' : 'voltam a ficar livres'} e ${dinheiro(estorno)} ${n === 1 ? 'volta' : 'voltam'} para você. Isso não pode ser desfeito.`,
      'Cancelar ingressos',
      true,
      'Manter ingressos',
    );
    if (!ok) return;
    setCancelando(true);
    setErro(null);
    try {
      await ingressoService.cancelar(escolhidos.map((i) => i.codigo));
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setErro(mensagemDe(e));
      vm.recarregarSilencioso();
    } finally {
      setCancelando(false);
    }
  }

  return (
    <Tela
      rodape={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Texto tipo="destaque">Estorno</Texto>
            <Pulso chave={n} intensidade={1.1}>
              <Texto tipo="titulo3" style={{ fontVariant: ['tabular-nums'] }}>
                {dinheiro(estorno)}
              </Texto>
            </Pulso>
          </View>
          <Botao titulo={rotuloBotao} cor={c.vermelho} aoTocar={cancelar} carregando={cancelando} desabilitado={n === 0} />
        </>
      }>
      <Secao>
        <Linha
          esquerda={<Arte titulo={sessao.filme.titulo} id={sessao.filme.id} poster={sessao.filme.posterUrl} mini />}
          titulo={sessao.filme.titulo}
          subtitulo={`${dataHora(sessao.inicio)}, ${sessao.sala.nome}`}
          ultima
        />
      </Secao>

      <Secao
        titulo="Lugares"
        nota={`Dá para cancelar até ${CANCELAMENTO_MINUTOS} minutos antes do início. O valor volta para a forma de pagamento (simulado) e o lugar fica livre para outra pessoa.`}>
        {ingressos.length > 1 ? (
          <Linha
            esquerda={<Marca marcado={todosMarcados} cor={c.vermelho} apagada={c.rotuloTerciario} />}
            titulo={todosMarcados ? 'Desmarcar todos' : 'Todos os lugares'}
            valor={`${ingressos.length} ${ingressos.length === 1 ? 'lugar' : 'lugares'}`}
            acessorio="nenhum"
            aoTocar={alternarTodos}
          />
        ) : null}
        {ingressos.map((i, indice) => {
          const marcado = selecao.includes(i.codigo);
          return (
            <Linha
              key={i.codigo}
              esquerda={<Marca marcado={marcado} cor={c.vermelho} apagada={c.rotuloTerciario} />}
              titulo={`Lugar ${i.assento}`}
              subtitulo={i.codigo}
              valor={dinheiro(i.valor)}
              acessorio="nenhum"
              aoTocar={() => alternar(i.codigo)}
              ultima={indice === ingressos.length - 1}
            />
          );
        })}
      </Secao>

      <TextoErro texto={erro} />
      <View style={{ height: espaco.s, marginHorizontal: margem }} />
    </Tela>
  );
}

// círculo de seleção do iOS, com um pulinho ao marcar
function Marca({ marcado, cor, apagada }: { marcado: boolean; cor: string; apagada: string }) {
  return (
    <Pulso chave={marcado ? 'sim' : 'nao'} intensidade={marcado ? 1.2 : 0.9}>
      <Ionicons name={marcado ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={marcado ? cor : apagada} />
    </Pulso>
  );
}
