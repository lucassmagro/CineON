import { Tabs } from 'expo-router';

import { barraAbas, iconeAba, useOpcoesAbas } from '@/ui/navegacao';

export default function AbasOperador() {
  const opcoes = useOpcoesAbas();
  return (
    <Tabs screenOptions={opcoes} tabBar={barraAbas}>
      <Tabs.Screen name="bilheteria" options={{ title: 'Bilheteria', tabBarIcon: iconeAba('storefront-outline', 'storefront') }} />
      <Tabs.Screen name="validar" options={{ title: 'Entrada', tabBarIcon: iconeAba('checkmark-circle-outline', 'checkmark-circle') }} />
      <Tabs.Screen name="gerencia" options={{ title: 'Gerência', tabBarIcon: iconeAba('briefcase-outline', 'briefcase') }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta', tabBarIcon: iconeAba('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
