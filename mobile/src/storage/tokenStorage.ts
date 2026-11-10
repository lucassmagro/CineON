// No celular o token fica no SecureStore (Keychain/Keystore), que é melhor que o AsyncStorage
// (texto puro). Na Web não existe SecureStore, então usa o localStorage pra a pessoa continuar
// logada ao recarregar a página. O token expira na API (JWT_MINUTOS) e o logout apaga ele.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE = 'cineon_token';
// reserva pra quando o navegador bloqueia o localStorage (aba anônima, por exemplo)
let tokenEmMemoria: string | null = null;

function storageWeb(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function salvarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    tokenEmMemoria = token;
    try {
      storageWeb()?.setItem(CHAVE, token);
    } catch {
      // sem espaço ou bloqueado: segue só com a memória
    }
    return;
  }
  await SecureStore.setItemAsync(CHAVE, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return storageWeb()?.getItem(CHAVE) ?? tokenEmMemoria;
    } catch {
      return tokenEmMemoria;
    }
  }
  return SecureStore.getItemAsync(CHAVE);
}

export async function removerToken(): Promise<void> {
  if (Platform.OS === 'web') {
    tokenEmMemoria = null;
    try {
      storageWeb()?.removeItem(CHAVE);
    } catch {
      // nada a fazer
    }
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
