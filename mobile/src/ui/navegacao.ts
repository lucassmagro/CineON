import { cores } from './tema';

export const opcoesPilha = {
  headerTintColor: cores.azul,
  headerStyle: { backgroundColor: cores.fundo },
  headerTitleStyle: { color: cores.texto, fontWeight: '600' as const },
  headerShadowVisible: false,
  headerBackTitle: 'Voltar',
  contentStyle: { backgroundColor: cores.fundo },
};

export const opcoesAbas = {
  headerShown: false,
  tabBarActiveTintColor: cores.azul,
  tabBarInactiveTintColor: cores.textoSecundario,
  tabBarStyle: { backgroundColor: 'rgba(249,249,249,0.97)', borderTopColor: cores.separador },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const },
};
