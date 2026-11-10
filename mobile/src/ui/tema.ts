// Cores e tipografia seguindo o iOS. O tema acompanha o modo claro/escuro do aparelho.
import { useContext, useMemo } from 'react';
import { Platform, useColorScheme, useWindowDimensions, type TextStyle } from 'react-native';

import { ContextoAparencia } from './aparencia';

export type Paleta = {
  escuro: boolean;
  fundo: string;
  fundoElevado: string;
  fundoTerciario: string;
  rotulo: string;
  rotuloSecundario: string;
  rotuloTerciario: string;
  separador: string;
  preenchimento: string;
  preenchimentoForte: string;
  azul: string;
  verde: string;
  vermelho: string;
  laranja: string;
  amarelo: string;
  indigo: string;
  cinza: string;
};

const claro: Paleta = {
  escuro: false,
  fundo: '#F2F2F7',
  fundoElevado: '#FFFFFF',
  fundoTerciario: '#F2F2F7',
  rotulo: '#000000',
  rotuloSecundario: 'rgba(60,60,67,0.6)',
  rotuloTerciario: 'rgba(60,60,67,0.3)',
  separador: 'rgba(60,60,67,0.18)',
  preenchimento: 'rgba(118,118,128,0.12)',
  preenchimentoForte: 'rgba(118,118,128,0.24)',
  azul: '#007AFF',
  verde: '#34C759',
  vermelho: '#FF3B30',
  laranja: '#FF9500',
  amarelo: '#FFCC00',
  indigo: '#5856D6',
  cinza: '#8E8E93',
};

const escuro: Paleta = {
  escuro: true,
  fundo: '#000000',
  fundoElevado: '#1C1C1E',
  fundoTerciario: '#2C2C2E',
  rotulo: '#FFFFFF',
  rotuloSecundario: 'rgba(235,235,245,0.6)',
  rotuloTerciario: 'rgba(235,235,245,0.3)',
  separador: 'rgba(84,84,88,0.6)',
  preenchimento: 'rgba(118,118,128,0.24)',
  preenchimentoForte: 'rgba(118,118,128,0.36)',
  azul: '#0A84FF',
  verde: '#30D158',
  vermelho: '#FF453A',
  laranja: '#FF9F0A',
  amarelo: '#FFD60A',
  indigo: '#5E5CE6',
  cinza: '#8E8E93',
};

export const coresFundo = { claro: claro.fundo, escuro: escuro.fundo };

// as duas paletas inteiras, pras miniaturas do seletor de aparência
export const paletas = { claro, escuro };

export function useTema(): Paleta {
  const sistema = useColorScheme();
  const aparencia = useContext(ContextoAparencia);
  const ativo = aparencia ? aparencia.escuro : sistema === 'dark';
  return ativo ? escuro : claro;
}

export function useEstilos<T>(criar: (c: Paleta) => T): T {
  const c = useTema();
  return useMemo(() => criar(c), [criar, c]);
}

// no iOS a fonte padrão já é a SF Pro; na Web pedimos a do sistema
const familia: TextStyle = Platform.OS === 'web'
  ? { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, sans-serif' }
  : {};

// escala de tipos do iOS (Dynamic Type, tamanho padrão)
export const tipos = {
  tituloGrande: { ...familia, fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  titulo1: { ...familia, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  titulo2: { ...familia, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  titulo3: { ...familia, fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  destaque: { ...familia, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  corpo: { ...familia, fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.41 },
  chamada: { ...familia, fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subtitulo: { ...familia, fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  nota: { ...familia, fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  legenda: { ...familia, fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  legenda2: { ...familia, fontSize: 11, lineHeight: 13, fontWeight: '400', letterSpacing: 0.07 },
} satisfies Record<string, TextStyle>;

export type Tipo = keyof typeof tipos;

export const fonteCodigo: TextStyle = {
  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, "SF Mono", Menlo, monospace' }),
};

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 32, xxxl: 44 };

export const raio = { pequeno: 8, medio: 12, grande: 16, cartao: 20, pilula: 999 };

// larguras máximas do conteúdo: listas e formulários não esticam em tablet/desktop
export const larguraLeitura = 680;
export const larguraGrade = 1080;

// margens laterais do iOS: 16 no celular, 20 em telas maiores
export function useMargem(): number {
  const { width } = useWindowDimensions();
  return width >= 600 ? 20 : 16;
}
