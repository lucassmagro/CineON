import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { useCarregar } from '@/hooks/useCarregar';
import { salaService } from '@/services/cineon';
import { Botao, BotaoCabecalho, Carregando, Etiqueta, Linha, MensagemErro, Secao, Tela, Vazio } from '@/ui/componentes';
import { espaco, useMargem, useTema } from '@/ui/tema';

export default function ListaSalas() {
  const router = useRouter();
  const c = useTema();
  const margem = useMargem();
  const vm = useCarregar(salaService.listar);
  const nova = () => router.push('/gestao/sala');

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const salas = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="add" rotulo="Nova sala" texto="Nova" aoTocar={nova} /> }} />
      <View style={{ paddingHorizontal: margem, marginBottom: espaco.xxl }}>
        <Botao titulo="Cadastrar nova sala" icone="add-circle" aoTocar={nova} />
      </View>
      {salas.length === 0 ? (
        <Vazio icone="grid-outline" titulo="Nenhuma sala cadastrada" texto="Use o botão acima pra cadastrar a primeira." />
      ) : (
        <Secao titulo={`${salas.length} ${salas.length === 1 ? 'sala' : 'salas'}`} nota="Os assentos de cada sala são criados junto com ela. Toque numa sala pra ver o mapa, editar ou excluir.">
          {salas.map((s, i) => (
            <Linha
              key={s.id}
              icone={{ nome: 'grid', cor: s.ativa ? c.indigo : c.cinza }}
              titulo={s.nome}
              subtitulo={`${s.capacidade} lugares em ${s.filas} ${s.filas === 1 ? 'fila' : 'filas'}`}
              direita={s.ativa ? undefined : <Etiqueta texto="Inativa" cor={c.cinza} />}
              aoTocar={() => router.push({ pathname: '/gestao/sala', params: { id: s.id } })}
              ultima={i === salas.length - 1}
            />
          ))}
        </Secao>
      )}
    </Tela>
  );
}
