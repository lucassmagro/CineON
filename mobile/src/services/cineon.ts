// Chamadas da API, uma função por endpoint.
import type {
  DadosFilme,
  Filme,
  FilmeComSessoes,
  Ingresso,
  MapaSessao,
  RelatorioOcupacao,
  RelatorioVendas,
  Reserva,
  Sala,
  SalaDetalhada,
  Sessao,
  Usuario,
} from '@/models/tipos';

import { api } from './api';

const q = (params: Record<string, string | number | undefined>) => {
  const partes = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return partes.length ? `?${partes.join('&')}` : '';
};

export const authService = {
  login: (email: string, senha: string) => api.post<{ usuario: Usuario; accessToken: string }>('/auth/login', { email, senha }),
  cadastrar: (dados: { nome: string; email: string; senha: string }) => api.post<Usuario>('/auth/cadastro', dados),
  eu: () => api.get<Usuario>('/auth/me'),
  criarOperador: (dados: { nome: string; email: string; senha: string }) => api.post<Usuario>('/usuarios/operadores', dados),
};

export const filmeService = {
  emCartaz: () => api.get<Filme[]>('/filmes?emCartaz=true'),
  todos: () => api.get<Filme[]>('/filmes'),
  buscar: (id: number) => api.get<FilmeComSessoes>(`/filmes/${id}`),
  criar: (dados: DadosFilme) => api.post<Filme>('/filmes', dados),
  atualizar: (id: number, dados: Partial<DadosFilme & { ativo: boolean }>) => api.put<Filme>(`/filmes/${id}`, dados),
  remover: (id: number) => api.del(`/filmes/${id}`),
};

export const salaService = {
  listar: () => api.get<Sala[]>('/salas'),
  buscar: (id: number) => api.get<SalaDetalhada>(`/salas/${id}`),
  criar: (dados: { nome: string; filas: number; assentosPorFila: number }) => api.post<SalaDetalhada>('/salas', dados),
  atualizar: (id: number, dados: { nome?: string; ativa?: boolean }) => api.put<Sala>(`/salas/${id}`, dados),
  remover: (id: number) => api.del(`/salas/${id}`),
};

export const sessaoService = {
  listar: (filtro: { filmeId?: number; data?: string; todas?: boolean } = {}) =>
    api.get<Sessao[]>(`/sessoes${q({ filmeId: filtro.filmeId, data: filtro.data, todas: filtro.todas ? 'true' : undefined })}`),
  buscar: (id: number) => api.get<Sessao>(`/sessoes/${id}`),
  mapa: (id: number) => api.get<MapaSessao>(`/sessoes/${id}/assentos`),
  criar: (dados: { filmeId: number; salaId: number; inicio: string; preco: number }) => api.post<Sessao>('/sessoes', dados),
  atualizarPreco: (id: number, preco: number) => api.put<Sessao>(`/sessoes/${id}`, { preco }),
  remover: (id: number) => api.del(`/sessoes/${id}`),
};

export const reservaService = {
  reservar: (dados: { sessaoId: number; assentoIds: number[]; nomeCliente?: string }) => api.post<Reserva>('/reservas', dados),
  buscar: (id: number) => api.get<Reserva>(`/reservas/${id}`),
  desistir: (id: number) => api.del(`/reservas/${id}`),
  pagar: (id: number) => api.post<Reserva>(`/reservas/${id}/pagamento`),
};

// igual ao CANCELAMENTO_ANTECEDENCIA_MIN da API; a API confere de novo de qualquer jeito
export const CANCELAMENTO_MINUTOS = 30;

export const ingressoService = {
  meus: () => api.get<Ingresso[]>('/ingressos/meus'),
  validar: (codigo: string) => api.post<Ingresso>('/ingressos/validacao', { codigo }),
  cancelar: (codigos: string[]) => api.post<Ingresso[]>('/ingressos/cancelamento', { codigos }),
};

export const relatorioService = {
  ocupacao: (inicio: string, fim: string) => api.get<RelatorioOcupacao>(`/relatorios/ocupacao${q({ inicio, fim })}`),
  vendas: (inicio: string, fim: string) => api.get<RelatorioVendas>(`/relatorios/vendas${q({ inicio, fim })}`),
};
