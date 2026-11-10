// (cliente) e (operador) são grupos do expo-router, não aparecem na URL.
// O index.tsx redireciona pra área certa conforme o papel do usuário.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import { cores } from '@/ui/tema';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </AuthProvider>
  );
}
