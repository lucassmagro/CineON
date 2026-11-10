// No celular usa o alerta nativo do sistema. Na Web o dialogos.web.tsx mostra toasts.
import { Alert } from 'react-native';

export type TipoAviso = 'sucesso' | 'erro' | 'info';

export function notificar(tipo: TipoAviso, titulo: string, mensagem?: string): void {
  // sucesso no celular não precisa de alerta: a própria tela já mostra o resultado
  if (tipo === 'sucesso') return;
  Alert.alert(titulo, mensagem);
}

export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar = 'Confirmar',
  destrutivo = false,
  textoDesistir = 'Cancelar',
): Promise<boolean> {
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [
      { text: textoDesistir, style: 'cancel', onPress: () => resolver(false) },
      { text: textoConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: () => resolver(true) },
    ]);
  });
}
