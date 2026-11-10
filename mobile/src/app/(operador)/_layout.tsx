// área do operador (bilheteria e gerência)
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Carregando } from '@/ui/componentes';
import { opcoesPilha } from '@/ui/navegacao';

export default function LayoutOperador() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.papel !== 'OPERADOR') return <Redirect href="/" />;

  return (
    <Stack screenOptions={opcoesPilha}>
      <Stack.Screen name="(painel)" options={{ headerShown: false, title: 'Voltar' }} />
      <Stack.Screen name="venda/[sessaoId]" options={{ title: 'Venda no balcão' }} />
      <Stack.Screen name="venda-reserva/[id]" options={{ title: 'Pagamento' }} />
      <Stack.Screen name="gestao/filmes" options={{ title: 'Filmes' }} />
      <Stack.Screen name="gestao/filme" options={{ title: 'Filme' }} />
      <Stack.Screen name="gestao/salas" options={{ title: 'Salas' }} />
      <Stack.Screen name="gestao/sala" options={{ title: 'Sala' }} />
      <Stack.Screen name="gestao/sessoes" options={{ title: 'Sessões' }} />
      <Stack.Screen name="gestao/sessao" options={{ title: 'Sessão' }} />
      <Stack.Screen name="gestao/relatorios" options={{ title: 'Relatórios' }} />
      <Stack.Screen name="gestao/operador" options={{ title: 'Novo operador' }} />
    </Stack>
  );
}
