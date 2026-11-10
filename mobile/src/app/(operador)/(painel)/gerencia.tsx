import { useRouter, type Href } from 'expo-router';

import { Grupo, Linha, Tela, TituloGrande } from '@/ui/componentes';

export default function Gerencia() {
  const router = useRouter();
  const ir = (rota: Href) => () => router.push(rota);

  return (
    <Tela semCabecalho>
      <TituloGrande texto="Gerência" />
      <Grupo titulo="Cadastros">
        <Linha titulo="Filmes" aoTocar={ir('/gestao/filmes')} />
        <Linha titulo="Salas" aoTocar={ir('/gestao/salas')} />
        <Linha titulo="Sessões" aoTocar={ir('/gestao/sessoes')} ultima />
      </Grupo>
      <Grupo titulo="Relatórios">
        <Linha titulo="Vendas e ocupação" aoTocar={ir('/gestao/relatorios')} ultima />
      </Grupo>
      <Grupo titulo="Equipe">
        <Linha titulo="Novo operador" aoTocar={ir('/gestao/operador')} ultima />
      </Grupo>
    </Tela>
  );
}
