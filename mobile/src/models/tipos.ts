// tipos das respostas da API
export type Papel = 'CLIENTE' | 'OPERADOR';

export type Usuario = { id: number; nome: string; email: string; papel: Papel };

export type Classificacao = 'L' | '10' | '12' | '14' | '16' | '18';

export type Filme = {
  id: number;
  titulo: string;
  sinopse: string;
  duracaoMin: number;
  classificacao: Classificacao;
  genero: string;
  ativo: boolean;
};

export type DadosFilme = Pick<Filme, 'titulo' | 'sinopse' | 'duracaoMin' | 'classificacao' | 'genero'>;

export type Sessao = {
  id: number;
  inicio: string;
  fim: string;
  preco: number;
  filme: { id: number; titulo: string; duracaoMin: number; classificacao: string; genero: string };
  sala: { id: number; nome: string };
};

export type FilmeComSessoes = Filme & { sessoes: Sessao[] };

export type Sala = { id: number; nome: string; ativa: boolean; capacidade: number; filas: number; sessoes: number };

export type SalaDetalhada = Sala & { assentos: { id: number; fila: string; numero: number }[] };

export type StatusAssento = 'LIVRE' | 'RESERVADO' | 'VENDIDO';

export type MapaSessao = {
  sessao: Sessao;
  filas: { fila: string; assentos: { id: number; numero: number; status: StatusAssento; minhaReserva: boolean }[] }[];
  resumo: { livres: number; reservados: number; vendidos: number; capacidade: number };
};

export type StatusReserva = 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';

export type Reserva = {
  id: number;
  status: StatusReserva;
  canal: 'ONLINE' | 'BALCAO';
  nomeCliente: string | null;
  criadaEm: string;
  expiraEm: string;
  valorTotal: number;
  sessao: Sessao;
  assentos: { id: number; fila: string; numero: number; rotulo: string }[];
  ingressos: { codigo: string; status: StatusIngresso; valor: number; assento: string }[];
};

export type StatusIngresso = 'VALIDO' | 'UTILIZADO' | 'CANCELADO';

export type Ingresso = {
  codigo: string;
  status: StatusIngresso;
  valor: number;
  assento: string;
  emitidoEm: string;
  utilizadoEm: string | null;
  nomeCliente: string | null;
  sessao: Sessao;
};

export type LinhaOcupacao = {
  sessaoId: number;
  filmeId: number;
  filme: string;
  sala: string;
  inicio: string;
  preco: number;
  capacidade: number;
  vendidos: number;
  utilizados: number;
  taxaOcupacao: number;
  receita: number;
};

export type RelatorioOcupacao = {
  sessoes: LinhaOcupacao[];
  totais: { sessoes: number; capacidade: number; vendidos: number; taxaOcupacao: number; receita: number };
};

export type RelatorioVendas = {
  receitaTotal: number;
  ingressosVendidos: number;
  porCanal: { canal: 'ONLINE' | 'BALCAO'; reservas: number; valor: number }[];
  porFilme: { filmeId: number; filme: string; sessoes: number; ingressos: number; receita: number; taxaOcupacao: number }[];
};
