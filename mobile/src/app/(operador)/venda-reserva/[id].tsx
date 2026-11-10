import { useLocalSearchParams, useRouter } from 'expo-router';

import { TelaReserva } from '@/telas/TelaReserva';

export default function PagamentoBalcao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <TelaReserva
      reservaId={Number(id)}
      acaoFinal={{ titulo: 'Nova venda', aoTocar: () => router.dismissAll() }}
      aoVoltarAoMapa={() => router.back()}
    />
  );
}
