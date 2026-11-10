import { useLocalSearchParams, useRouter } from 'expo-router';

import { TelaMapaSessao } from '@/telas/TelaMapaSessao';

export default function SessaoCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <TelaMapaSessao
      sessaoId={Number(id)}
      aoReservar={(reservaId) => router.push({ pathname: '/reserva/[id]', params: { id: reservaId } })}
    />
  );
}
