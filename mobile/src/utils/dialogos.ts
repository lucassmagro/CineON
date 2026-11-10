// Alert.alert não faz nada na Web, então lá usa window.confirm/alert
import { Alert, Platform } from 'react-native';

export function avisar(titulo: string, mensagem?: string): void {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }
  Alert.alert(titulo, mensagem);
}

export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar = 'Confirmar',
  destrutivo = false,
  textoDesistir = 'Cancelar',
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [
      { text: textoDesistir, style: 'cancel', onPress: () => resolver(false) },
      { text: textoConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: () => resolver(true) },
    ]);
  });
}
