// Ícone do app (quadrado com cantos de ícone do iOS) + nome.
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Texto } from '@/ui/componentes';
import { useTema } from '@/ui/tema';

export function Marca({ subtitulo }: { subtitulo?: string }) {
  const c = useTema();
  return (
    <View style={estilos.marca}>
      <View style={[estilos.icone, { backgroundColor: c.rotulo }]}>
        <Ionicons name="film" size={38} color={c.fundo} />
      </View>
      <Texto tipo="tituloGrande" style={{ letterSpacing: -0.5 }}>
        CineON
      </Texto>
      {subtitulo ? (
        <Texto tipo="subtitulo" cor="secundario" style={{ textAlign: 'center' }}>
          {subtitulo}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: { alignItems: 'center', gap: 6 },
  icone: { width: 76, height: 76, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
});
