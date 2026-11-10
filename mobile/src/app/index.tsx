import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Carregando } from '@/ui/componentes';

export default function Inicio() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;
  return <Redirect href={usuario.papel === 'OPERADOR' ? '/bilheteria' : '/filmes'} />;
}
