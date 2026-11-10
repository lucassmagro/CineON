import { useLocalSearchParams, useRouter } from 'expo-router';

import { TelaReserva } from '@/telas/TelaReserva';

export default function ReservaCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <TelaReserva
      reservaId={Number(id)}
      acaoFinal={{
        titulo: 'Ver meus ingressos',
        aoTocar: () => {
          router.dismissAll();
          router.navigate('/ingressos');
        },
      }}
      aoVoltarAoMapa={() => router.back()}
    />
  );
}
