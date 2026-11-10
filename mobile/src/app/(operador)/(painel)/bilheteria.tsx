import { useRouter } from 'expo-router';

import { ListaSessoesDoDia } from '@/components/ListaSessoesDoDia';
import { useCarregar } from '@/hooks/useCarregar';
import { sessaoService } from '@/services/cineon';
import { Carregando, MensagemErro, Tela } from '@/ui/componentes';

export default function Bilheteria() {
  const router = useRouter();
  const vm = useCarregar(() => sessaoService.listar());

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;

  return (
    <Tela semCabecalho titulo="Bilheteria" subtitulo="Escolha a sessão para vender no balcão." aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <ListaSessoesDoDia
        sessoes={vm.dados ?? []}
        aoTocar={(s) => router.push({ pathname: '/venda/[sessaoId]', params: { sessaoId: s.id } })}
      />
    </Tela>
  );
}
