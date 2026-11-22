// área do operador (bilheteria e gerência)
import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Carregando } from '@/ui/componentes';
import { useOpcoesPilha } from '@/ui/navegacao';
import { opcoesModal, Pilha } from '@/ui/Pilha';

// mesmo caso do cliente: o painel fica por baixo de qualquer tela aberta direto
export const unstable_settings = { initialRouteName: '(painel)' };

export default function LayoutOperador() {
  const { usuario, verificando } = useAuth();
  const opcoes = useOpcoesPilha();
  if (verificando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.papel !== 'OPERADOR') return <Redirect href="/" />;

  return (
    <Pilha screenOptions={opcoes}>
      <Pilha.Screen name="(painel)" options={{ headerShown: false, title: 'Painel' }} />
      <Pilha.Screen name="venda/[sessaoId]" options={{ title: 'Venda no balcão' }} />
      <Pilha.Screen name="venda-reserva/[id]" options={{ title: 'Pagamento' }} />
      <Pilha.Screen name="gestao/filmes" options={{ title: 'Filmes' }} />
      <Pilha.Screen name="gestao/filme" options={{ title: 'Filme', ...opcoesModal }} />
      <Pilha.Screen name="gestao/salas" options={{ title: 'Salas' }} />
      <Pilha.Screen name="gestao/sala" options={{ title: 'Sala', ...opcoesModal }} />
      <Pilha.Screen name="gestao/sessoes" options={{ title: 'Sessões' }} />
      <Pilha.Screen name="gestao/sessao" options={{ title: 'Sessão', ...opcoesModal }} />
      <Pilha.Screen name="gestao/relatorios" options={{ title: 'Vendas e ocupação' }} />
      <Pilha.Screen name="gestao/operador" options={{ title: 'Novo operador', ...opcoesModal }} />
    </Pilha>
  );
}
