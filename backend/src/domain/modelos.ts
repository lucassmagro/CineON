// Tipos usados pelos services. Os repositories convertem o que vem do Prisma
// pra esses tipos (ex.: Decimal vira number).

export type Papel = "CLIENTE" | "OPERADOR";
export type StatusAssento = "LIVRE" | "RESERVADO" | "VENDIDO";
export type StatusReserva = "PENDENTE" | "PAGA" | "EXPIRADA" | "CANCELADA";
export type CanalVenda = "ONLINE" | "BALCAO";
export type StatusIngresso = "VALIDO" | "UTILIZADO" | "CANCELADO";

export type UsuarioAutenticado = { id: number; papel: Papel };

// injetado nos services pra dar pra testar a expiração sem esperar 10 min
export type Relogio = () => Date;

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  criadoEm: Date;
};

export type Filme = {
  id: number;
  titulo: string;
  sinopse: string;
  duracaoMin: number;
  classificacao: string;
  genero: string;
  ativo: boolean;
};

export type DadosFilme = Omit<Filme, "id" | "ativo">;

export type Sala = { id: number; nome: string; ativa: boolean };

export type SalaResumo = Sala & { capacidade: number; filas: number; sessoes: number };

export type Assento = { id: number; fila: string; numero: number };

export type SalaComAssentos = SalaResumo & { assentos: Assento[] };

export type Sessao = {
  id: number;
  filmeId: number;
  salaId: number;
  inicio: Date;
  fim: Date;
  preco: number;
};

export type SessaoDetalhada = Sessao & {
  filme: { id: number; titulo: string; duracaoMin: number; classificacao: string; genero: string };
  sala: { id: number; nome: string };
};

export type AssentoDaSessao = {
  assentoId: number;
  fila: string;
  numero: number;
  status: StatusAssento;
  reservaId: number | null;
  reservaStatus: StatusReserva | null;
  reservaExpiraEm: Date | null;
  reservaUsuarioId: number | null;
};

export type Reserva = {
  id: number;
  usuarioId: number;
  sessaoId: number;
  status: StatusReserva;
  canal: CanalVenda;
  nomeCliente: string | null;
  criadaEm: Date;
  expiraEm: Date;
  valorTotal: number;
};

export type Ingresso = {
  id: number;
  codigo: string;
  reservaId: number;
  sessaoId: number;
  assentoId: number;
  valor: number;
  status: StatusIngresso;
  emitidoEm: Date;
  utilizadoEm: Date | null;
};

export type IngressoDetalhado = Ingresso & {
  fila: string;
  numero: number;
  donoId: number;
  nomeCliente: string | null;
  sessao: SessaoDetalhada;
};

export type ReservaDetalhada = Reserva & {
  sessao: SessaoDetalhada;
  assentos: { assentoId: number; fila: string; numero: number }[];
  ingressos: (Ingresso & { fila: string; numero: number })[];
};

export type LinhaOcupacao = {
  sessaoId: number;
  filmeId: number;
  filme: string;
  sala: string;
  inicio: Date;
  preco: number;
  capacidade: number;
  vendidos: number;
  utilizados: number;
  taxaOcupacao: number;
  receita: number;
};

export type VendasPorCanal = { canal: CanalVenda; reservas: number; valor: number };
