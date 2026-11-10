// cores parecidas com as do iOS
import { Platform } from 'react-native';

export const cores = {
  fundo: '#F2F2F7', // systemGroupedBackground
  cartao: '#FFFFFF',
  texto: '#000000',
  textoSecundario: '#8E8E93', // systemGray
  separador: '#E5E5EA',
  azul: '#007AFF',
  azulClaro: '#E5F0FF',
  verde: '#34C759',
  verdeClaro: '#E8F8EC',
  laranja: '#FF9500',
  laranjaClaro: '#FFF1DC',
  vermelho: '#FF3B30',
  vermelhoClaro: '#FFEBEA',
  cinzaAssento: '#D1D1D6',
  bordaAssento: '#C7C7CC',
};

export const raio = { pequeno: 8, medio: 12, grande: 16 };

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

export const fonte = {
  tituloGrande: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.3 },
  titulo: { fontSize: 22, fontWeight: '700' as const },
  subtitulo: { fontSize: 17, fontWeight: '600' as const },
  corpo: { fontSize: 17 },
  secundario: { fontSize: 15 },
  rodape: { fontSize: 13 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
};
