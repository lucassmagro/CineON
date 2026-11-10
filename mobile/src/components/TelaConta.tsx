import { View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { Botao, Grupo, Linha, Tela, TituloGrande } from '@/ui/componentes';
import { espaco } from '@/ui/tema';
import { confirmar } from '@/utils/dialogos';

export function TelaConta({ titulo }: { titulo: string }) {
  const { usuario, sair } = useAuth();

  async function sairDaConta() {
    if (await confirmar('Sair da conta?', 'Você precisará entrar novamente.', 'Sair', true)) await sair();
  }

  return (
    <Tela semCabecalho>
      <TituloGrande texto={titulo} />
      <Grupo>
        <Linha titulo="Nome" valor={usuario?.nome} />
        <Linha titulo="E-mail" valor={usuario?.email} />
        <Linha titulo="Perfil" valor={usuario?.papel === 'OPERADOR' ? 'Operador' : 'Cliente'} ultima />
      </Grupo>
      <View style={{ paddingHorizontal: espaco.l }}>
        <Botao titulo="Sair" tipo="destrutivo" aoTocar={sairDaConta} />
      </View>
    </Tela>
  );
}
