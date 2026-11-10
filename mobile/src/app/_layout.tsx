// (cliente) e (operador) são grupos do expo-router, não aparecem na URL.
// O index.tsx redireciona pra área certa conforme o papel do usuário.
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import { TemaProvider } from '@/contexts/TemaContext';
import { Pilha } from '@/ui/Pilha';
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

// separado porque o tema só pode ser lido dentro do TemaProvider
function Raiz() {
  const c = useTema();
  const base = c.escuro ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, primary: c.azul, background: c.fundo, card: c.fundoElevado, text: c.rotulo, border: c.separador } }}>
      <StatusBar style={c.escuro ? 'light' : 'dark'} />
      <Pilha screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.fundo }, cardStyle: { backgroundColor: c.fundo } }} />
    </ThemeProvider>
  );
}
