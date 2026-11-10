import { useRouter } from 'expo-router';

import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Carregando, Grupo, Linha, MensagemErro, Tela, TituloGrande, Vazio } from '@/ui/componentes';

export default function EmCartaz() {
  const router = useRouter();
  const vm = useCarregar(filmeService.emCartaz);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const filmes = vm.dados ?? [];

  return (
    <Tela semCabecalho aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <TituloGrande texto="Em cartaz" />
      {filmes.length === 0 ? (
        <Vazio texto="Nenhum filme com sessões disponíveis no momento." />
      ) : (
        <Grupo>
          {filmes.map((f, i) => (
            <Linha
              key={f.id}
              titulo={f.titulo}
              subtitulo={`${f.genero} · ${f.duracaoMin} min · ${f.classificacao === 'L' ? 'Livre' : `${f.classificacao} anos`}`}
              aoTocar={() => router.push({ pathname: '/filme/[id]', params: { id: f.id } })}
              ultima={i === filmes.length - 1}
            />
          ))}
        </Grupo>
      )}
    </Tela>
  );
}
