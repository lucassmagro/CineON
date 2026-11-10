import { Tabs } from 'expo-router';

import { barraAbas, iconeAba, useOpcoesAbas } from '@/ui/navegacao';

export default function AbasCliente() {
  const opcoes = useOpcoesAbas();
  return (
    <Tabs screenOptions={opcoes} tabBar={barraAbas}>
      <Tabs.Screen name="filmes" options={{ title: 'Em cartaz', tabBarIcon: iconeAba('film-outline', 'film') }} />
      <Tabs.Screen name="ingressos" options={{ title: 'Ingressos', tabBarIcon: iconeAba('ticket-outline', 'ticket') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Conta', tabBarIcon: iconeAba('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
