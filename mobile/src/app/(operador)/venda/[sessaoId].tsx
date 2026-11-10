import { useLocalSearchParams, useRouter } from 'expo-router';

import { TelaMapaSessao } from '@/telas/TelaMapaSessao';

export default function VendaBalcao() {
  const { sessaoId } = useLocalSearchParams<{ sessaoId: string }>();
  const router = useRouter();
  return (
    <TelaMapaSessao
      sessaoId={Number(sessaoId)}
      balcao
      aoReservar={(reservaId) => router.push({ pathname: '/venda-reserva/[id]', params: { id: reservaId } })}
    />
  );
}
