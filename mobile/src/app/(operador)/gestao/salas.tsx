import { Stack, useRouter } from 'expo-router';

import { useCarregar } from '@/hooks/useCarregar';
import { salaService } from '@/services/cineon';
import { Carregando, Etiqueta, Grupo, Linha, MensagemErro, Tela, Vazio } from '@/ui/componentes';
import { cores } from '@/ui/tema';

import { BotaoNovo } from '@/components/IconeAba';

export default function ListaSalas() {
  const router = useRouter();
  const vm = useCarregar(salaService.listar);

  if (vm.carregando) return <Carregando />;
  if (vm.erro) return <MensagemErro mensagem={vm.erro} aoTentarDeNovo={vm.recarregar} />;
  const salas = vm.dados ?? [];

  return (
    <Tela aoAtualizar={vm.recarregar} atualizando={vm.atualizando}>
      <Stack.Screen options={{ headerRight: () => <BotaoNovo aoTocar={() => router.push('/gestao/sala')} /> }} />
      {salas.length === 0 ? <Vazio texto="Nenhuma sala cadastrada." /> : null}
      <Grupo>
        {salas.map((s, i) => (
          <Linha
            key={s.id}
            titulo={s.nome}
            subtitulo={`${s.filas} filas · ${s.capacidade} lugares`}
            destaque={s.ativa ? undefined : <Etiqueta texto="Inativa" cor={cores.textoSecundario} fundo={cores.separador} />}
            aoTocar={() => router.push({ pathname: '/gestao/sala', params: { id: s.id } })}
            ultima={i === salas.length - 1}
          />
        ))}
      </Grupo>
    </Tela>
  );
}
