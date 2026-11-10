import { Tabs } from 'expo-router';

import { IconeAba } from '@/components/IconeAba';
import { opcoesAbas } from '@/ui/navegacao';

export default function AbasCliente() {
  return (
    <Tabs screenOptions={opcoesAbas}>
      <Tabs.Screen name="filmes" options={{ title: 'Em cartaz', tabBarIcon: ({ color }) => <IconeAba simbolo="▶︎" cor={color} /> }} />
      <Tabs.Screen name="ingressos" options={{ title: 'Ingressos', tabBarIcon: ({ color }) => <IconeAba simbolo="▤" cor={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <IconeAba simbolo="●" cor={color} /> }} />
    </Tabs>
  );
}
