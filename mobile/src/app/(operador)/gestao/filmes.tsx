import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao } from '@/components/SeloClassificacao';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { Botao, Carregando, Etiqueta, Linha, MensagemErro, Secao, Tela, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';
import { duracao } from '@/utils/formatar';

export default function ListaFilmes() {
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const vm = useCarregar(filmeService.todos);
  const novo = () => router.push('/gestao/filme');

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const filmes = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xxl }}>
        <Botao titulo="Cadastrar novo filme" icone="add-circle" aoTocar={novo} />
      </View>
      {filmes.length === 0 ? (
        <Vazio icone="film-outline" titulo="Nenhum filme cadastrado" texto="Use o botão acima pra cadastrar o primeiro." />
      ) : (
        <Secao titulo={`${filmes.length} ${filmes.length === 1 ? 'filme' : 'filmes'}`} nota="Toque num filme pra editar, tirar de exibição ou excluir.">
          {filmes.map((f, i) => (
            <Linha
              key={f.id}
              esquerda={<Arte titulo={f.titulo} id={f.id} poster={f.posterUrl} mini />}
              titulo={f.titulo}
              subtitulo={`${f.genero}, ${duracao(f.duracaoMin)}`}
              direita={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {f.ativo ? null : <Etiqueta texto="Inativo" cor={c.cinza} />}
                  <SeloClassificacao valor={f.classificacao} tamanho={18} />
                </View>
              }
              aoTocar={() => router.push({ pathname: '/gestao/filme', params: { id: f.id } })}
              ultima={i === filmes.length - 1}
            />
          ))}
        </Secao>
      )}
    </Tela>
  );
}

