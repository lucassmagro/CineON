import { useRouter } from 'expo-router';

import { useCarregar } from '@/hooks/useCarregar';
import { sessaoService } from '@/services/cineon';
import { Carregando, Grupo, Linha, MensagemErro, Tela, TituloGrande, Vazio } from '@/ui/componentes';
import { agruparPorDia, dinheiro, hora } from '@/utils/formatar';

export default function Bilheteria() {
  const router = useRouter();
  const vm = useCarregar(() => sessaoService.listar());

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const dias = agruparPorDia(vm.dados ?? [], (s) => s.inicio).slice(0, 3); // só os próximos 3 dias

  return (
    <Tela semCabecalho aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <TituloGrande texto="Bilheteria" subtitulo="Escolha a sessão para vender no balcão" />
      {dias.length === 0 ? <Vazio texto="Não há sessões futuras." /> : null}
      {dias.map((d) => (
        <Grupo key={d.dia} titulo={d.dia}>
          {d.itens.map((s, i) => (
            <Linha
              key={s.id}
              titulo={`${hora(s.inicio)}  ${s.filme.titulo}`}
              subtitulo={s.sala.nome}
              valor={dinheiro(s.preco)}
              aoTocar={() => router.push({ pathname: '/venda/[sessaoId]', params: { sessaoId: s.id } })}
              ultima={i === d.itens.length - 1}
            />
          ))}
        </Grupo>
      ))}
    </Tela>
  );
}
