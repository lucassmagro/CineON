import { Stack, useRouter } from 'expo-router';

import { useCarregar } from '@/hooks/useCarregar';
import { sessaoService } from '@/services/cineon';
import { Carregando, Grupo, Linha, MensagemErro, Tela, Vazio } from '@/ui/componentes';
import { agruparPorDia, dinheiro, hora } from '@/utils/formatar';

import { BotaoNovo } from '@/components/IconeAba';

export default function ListaSessoes() {
  const router = useRouter();
  const vm = useCarregar(() => sessaoService.listar());

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const dias = agruparPorDia(vm.dados ?? [], (s) => s.inicio);

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoNovo aoTocar={() => router.push('/gestao/sessao')} /> }} />
      {dias.length === 0 ? <Vazio texto="Nenhuma sessão futura." /> : null}
      {dias.map((d) => (
        <Grupo key={d.dia} titulo={d.dia}>
          {d.itens.map((s, i) => (
            <Linha
              key={s.id}
              titulo={`${hora(s.inicio)}  ${s.filme.titulo}`}
              subtitulo={s.sala.nome}
              valor={dinheiro(s.preco)}
              aoTocar={() => router.push({ pathname: '/gestao/sessao', params: { id: s.id } })}
              ultima={i === d.itens.length - 1}
            />
          ))}
        </Grupo>
      ))}
    </Tela>
  );
}
