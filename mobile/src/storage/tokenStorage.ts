// Token no SecureStore (Keychain/Keystore) em vez do AsyncStorage, que salva em texto puro.
// Na Web não tem SecureStore, então fica só em memória e some ao recarregar a página.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE = 'cineon_token';
let tokenEmMemoria: string | null = null;

export async function salvarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    tokenEmMemoria = token;
    return;
  }
  await SecureStore.setItemAsync(CHAVE, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === 'web') return tokenEmMemoria;
  return SecureStore.getItemAsync(CHAVE);
}

export async function removerToken(): Promise<void> {
  if (Platform.OS === 'web') {
    tokenEmMemoria = null;
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
