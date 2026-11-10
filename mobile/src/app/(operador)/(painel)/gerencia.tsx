import { useRouter, type Href } from 'expo-router';

import { Linha, Secao, Tela } from '@/ui/componentes';
import { useTema } from '@/ui/tema';

export default function Gerencia() {
  const router = useRouter();
  const c = useTema();
  const ir = (rota: Href) => () => router.push(rota);

  return (
    <Tela semCabecalho titulo="Gerência">
      <Secao titulo="Programação">
        <Linha icone={{ nome: 'film', cor: c.vermelho }} titulo="Filmes" aoTocar={ir('/gestao/filmes')} />
        <Linha icone={{ nome: 'grid', cor: c.indigo }} titulo="Salas" aoTocar={ir('/gestao/salas')} />
        <Linha icone={{ nome: 'calendar', cor: c.laranja }} titulo="Sessões" aoTocar={ir('/gestao/sessoes')} ultima />
      </Secao>
      <Secao titulo="Resultados">
        <Linha icone={{ nome: 'bar-chart', cor: c.verde }} titulo="Vendas e ocupação" aoTocar={ir('/gestao/relatorios')} ultima />
      </Secao>
      <Secao titulo="Equipe">
        <Linha icone={{ nome: 'person-add', cor: c.cinza }} titulo="Novo operador" aoTocar={ir('/gestao/operador')} ultima />
      </Secao>
    </Tela>
  );
}
