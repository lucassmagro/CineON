import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Arte } from '@/components/Arte';
import { SeloClassificacao } from '@/components/SeloClassificacao';
import { useCarregar } from '@/hooks/useCarregar';
import { filmeService } from '@/services/cineon';
import { BotaoCabecalho, Botao, Carregando, Etiqueta, Linha, MensagemErro, Secao, Tela, Vazio } from '@/ui/componentes';
import { useTema } from '@/ui/tema';
import { duracao } from '@/utils/formatar';

export default function ListaFilmes() {
  const router = useRouter();
  const c = useTema();
  const vm = useCarregar(filmeService.todos);
  const novo = () => router.push('/gestao/filme');

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const filmes = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="add" rotulo="Novo filme" aoTocar={novo} /> }} />
      {filmes.length === 0 ? (
        <Vazio icone="film-outline" titulo="Nenhum filme cadastrado" acao={<Botao titulo="Cadastrar filme" variante="tingido" compacto aoTocar={novo} />} />
      ) : (
        <Secao>
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

