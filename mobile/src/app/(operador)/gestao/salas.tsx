import { Stack, useRouter } from 'expo-router';

import { useCarregar } from '@/hooks/useCarregar';
import { salaService } from '@/services/cineon';
import { Botao, BotaoCabecalho, Carregando, Etiqueta, Linha, MensagemErro, Secao, Tela, Vazio } from '@/ui/componentes';
import { useTema } from '@/ui/tema';

export default function ListaSalas() {
  const router = useRouter();
  const c = useTema();
  const vm = useCarregar(salaService.listar);
  const nova = () => router.push('/gestao/sala');

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const salas = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoCabecalho icone="add" rotulo="Nova sala" aoTocar={nova} /> }} />
      {salas.length === 0 ? (
        <Vazio icone="grid-outline" titulo="Nenhuma sala cadastrada" acao={<Botao titulo="Cadastrar sala" variante="tingido" compacto aoTocar={nova} />} />
      ) : (
        <Secao>
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
