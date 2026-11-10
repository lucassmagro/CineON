// área do cliente; quem não for cliente volta pro início
import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Carregando } from '@/ui/componentes';
import { useOpcoesPilha } from '@/ui/navegacao';
import { Pilha } from '@/ui/Pilha';

export default function LayoutCliente() {
  const { usuario, verificando } = useAuth();
  const opcoes = useOpcoesPilha();
  if (verificando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.papel !== 'CLIENTE') return <Redirect href="/" />;

  return (
    <Pilha screenOptions={opcoes}>
      <Pilha.Screen name="(abas)" options={{ headerShown: false, title: 'Filmes' }} />
      <Pilha.Screen name="filme/[id]" options={{ title: '' }} />
      <Pilha.Screen name="sessao/[id]" options={{ title: 'Escolha os lugares' }} />
      <Pilha.Screen name="reserva/[id]" options={{ title: 'Pagamento' }} />
    </Pilha>
  );
}
