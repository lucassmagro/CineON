import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ListaSessoesDoDia } from '@/components/ListaSessoesDoDia';
import { useCarregar } from '@/hooks/useCarregar';
import { sessaoService } from '@/services/cineon';
import { Botao, BotaoCabecalho, Carregando, MensagemErro, Tela } from '@/ui/componentes';
import { espaco, useMargem } from '@/ui/tema';

export default function ListaSessoes() {
  const router = useRouter();
  const margem = useMargem();
  const nova = () => router.push('/gestao/sessao');
  const vm = useCarregar(() => sessaoService.listar());

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="add" rotulo="Nova sessão" texto="Nova" aoTocar={nova} /> }} />
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xxl }}>
        <Botao titulo="Cadastrar nova sessão" icone="add-circle" aoTocar={nova} />
      </View>
      <ListaSessoesDoDia sessoes={vm.dados ?? []} aoTocar={(s) => router.push({ pathname: '/gestao/sessao', params: { id: s.id } })} />
    </Tela>
  );
}
