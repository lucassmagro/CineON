import { Stack, useRouter } from 'expo-router';

import { BotaoNovo } from '@/components/IconeAba';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Carregando, Etiqueta, Grupo, Linha, MensagemErro, Tela, Vazio } from '@/ui/componentes';
import { cores } from '@/ui/tema';

export default function ListaFilmes() {
  const router = useRouter();
  const vm = useCarregar(filmeService.todos);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const filmes = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoNovo aoTocar={() => router.push('/gestao/filme')} /> }} />
      {filmes.length === 0 ? <Vazio texto="Nenhum filme cadastrado." /> : null}
      <Grupo>
        {filmes.map((f, i) => (
          <Linha
            key={f.id}
            titulo={f.titulo}
            subtitulo={`${f.genero} · ${f.duracaoMin} min · ${f.classificacao}`}
            destaque={f.ativo ? undefined : <Etiqueta texto="Inativo" cor={cores.textoSecundario} fundo={cores.separador} />}
            aoTocar={() => router.push({ pathname: '/gestao/filme', params: { id: f.id } })}
            ultima={i === filmes.length - 1}
          />
        ))}
      </Grupo>
    </Tela>
  );
}

