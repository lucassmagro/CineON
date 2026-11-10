import { Stack, useRouter } from 'expo-router';

import { ListaSessoesDoDia } from '@/components/ListaSessoesDoDia';
import { useCarregar } from '@/hooks/useCarregar';
import { sessaoService } from '@/services/cineon';
import { BotaoCabecalho, Carregando, MensagemErro, Tela } from '@/ui/componentes';

export default function ListaSessoes() {
  const router = useRouter();
  const vm = useCarregar(() => sessaoService.listar());

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="add" rotulo="Nova sessão" aoTocar={() => router.push('/gestao/sessao')} /> }} />
      <ListaSessoesDoDia sessoes={vm.dados ?? []} aoTocar={(s) => router.push({ pathname: '/gestao/sessao', params: { id: s.id } })} />
    </Tela>
  );
}
