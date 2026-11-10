import { Tabs } from 'expo-router';

import { IconeAba } from '@/components/IconeAba';
import { opcoesAbas } from '@/ui/navegacao';

export default function AbasOperador() {
  return (
    <Tabs screenOptions={opcoesAbas}>
      <Tabs.Screen name="bilheteria" options={{ title: 'Bilheteria', tabBarIcon: ({ color }) => <IconeAba simbolo="▤" cor={color} /> }} />
      <Tabs.Screen name="validar" options={{ title: 'Validar', tabBarIcon: ({ color }) => <IconeAba simbolo="✓" cor={color} /> }} />
      <Tabs.Screen name="gerencia" options={{ title: 'Gerência', tabBarIcon: ({ color }) => <IconeAba simbolo="▦" cor={color} /> }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta', tabBarIcon: ({ color }) => <IconeAba simbolo="●" cor={color} /> }} />
    </Tabs>
  );
}
