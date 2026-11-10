import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

import { BarraAbas, type PropsBarraAbas } from './BarraAbas';
import type { NomeIcone } from './componentes';
import { useReduzirMovimento } from './movimento';
import { tipos, useTema } from './tema';

export function useOpcoesPilha() {
  const c = useTema();
  return {
    headerTintColor: c.azul,
    headerStyle: { backgroundColor: c.fundo },
    headerTitleStyle: { ...tipos.destaque, color: c.rotulo },
    headerShadowVisible: false,
    headerBackTitle: 'Voltar',
    contentStyle: { backgroundColor: c.fundo },
    cardStyle: { backgroundColor: c.fundo },
  };
}

export function useOpcoesAbas() {
  const reduzir = useReduzirMovimento();
  return {
    headerShown: false,
    // troca de aba com esmaecimento suave
    animation: reduzir ? ('none' as const) : ('fade' as const),
    // a barra padrão some; quem desenha é a pílula flutuante
    tabBarStyle: { position: 'absolute' as const },
  };
}

// a barra flutuante recebe as props da barra padrão das abas
export function barraAbas(props: unknown) {
  return <BarraAbas {...(props as PropsBarraAbas)} />;
}

export function iconeAba(nome: NomeIcone, nomeAtivo: NomeIcone) {
  return function IconeDaAba({ color, focused, size }: { color: ColorValue; focused: boolean; size?: number }) {
    return <Ionicons name={focused ? nomeAtivo : nome} size={size ?? 24} color={color} />;
  };
}
