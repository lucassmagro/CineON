// (cliente) e (operador) são grupos do expo-router, não aparecem na URL.
// O index.tsx redireciona pra área certa conforme o papel do usuário.
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BoasVindas } from '@/components/BoasVindas';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TemaProvider } from '@/contexts/TemaContext';
import { Pilha } from '@/ui/Pilha';
import { Toasts } from '@/ui/Toasts';
import { useTema } from '@/ui/tema';

export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <Raiz />
      </AuthProvider>
    </TemaProvider>
  );
}

// separado porque o tema e o login só podem ser lidos dentro dos providers
function Raiz() {
  const c = useTema();
  const { boasVindas, encerrarBoasVindas } = useAuth();
  const base = c.escuro ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, primary: c.azul, background: c.fundo, card: c.fundoElevado, text: c.rotulo, border: c.separador } }}>
      <StatusBar style={c.escuro ? 'light' : 'dark'} />
      <Toasts />
      <Pilha screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.fundo }, cardStyle: { backgroundColor: c.fundo } }} />
      {/* por cima de tudo, enquanto o app já carrega embaixo */}
      {boasVindas ? <BoasVindas dados={boasVindas} aoTerminar={encerrarBoasVindas} /> : null}
    </ThemeProvider>
  );
}
