// área do cliente; quem não for cliente volta pro início
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Carregando } from '@/ui/componentes';
import { opcoesPilha } from '@/ui/navegacao';

export default function LayoutCliente() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.papel !== 'CLIENTE') return <Redirect href="/" />;

  return (
    <Stack screenOptions={opcoesPilha}>
      <Stack.Screen name="(abas)" options={{ headerShown: false, title: 'Voltar' }} />
      <Stack.Screen name="filme/[id]" options={{ title: '' }} />
      <Stack.Screen name="sessao/[id]" options={{ title: 'Assentos' }} />
      <Stack.Screen name="reserva/[id]" options={{ title: 'Pagamento' }} />
    </Stack>
  );
}
