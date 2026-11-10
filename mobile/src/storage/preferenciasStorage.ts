// Preferência de aparência. Não é dado sensível, então fica no AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Aparencia } from '@/ui/aparencia';

const CHAVE = 'cineon_aparencia';

function valida(valor: string | null): Aparencia | null {
  return valor === 'sistema' || valor === 'claro' || valor === 'escuro' ? valor : null;
}

// na Web dá pra ler na hora, antes do primeiro desenho, e evitar a piscada de tema
export function lerAparenciaImediata(): Aparencia | null {
  if (Platform.OS !== 'web') return null;
  try {
    return valida(window.localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

export async function lerAparencia(): Promise<Aparencia | null> {
  try {
    return valida(await AsyncStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

export async function salvarAparencia(aparencia: Aparencia): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE, aparencia);
  } catch {
    // se não salvar, só volta a seguir o sistema na próxima vez
  }
}
