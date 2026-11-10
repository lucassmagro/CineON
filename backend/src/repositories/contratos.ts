// Interfaces dos repositories. Os services dependem só delas; as implementações
// com Prisma estão nos arquivos *PrismaRepository.ts.
import type {
  AssentoDaSessao,
  CanalVenda,
  DadosFilme,
  Filme,
  IngressoDetalhado,
  LinhaOcupacao,
  Papel,
  Reserva,
  ReservaDetalhada,
  SalaComAssentos,
  SalaResumo,
  Sala,
  SessaoDetalhada,
  StatusReserva,
  Usuario,
  VendasPorCanal,
} from "../domain/modelos.js";

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  criar(dados: { nome: string; email: string; senhaHash: string; papel: Papel }): Promise<Usuario>;
}

export interface FilmeRepository {
  listar(filtro: { somenteAtivos: boolean; comSessaoAPartirDe?: Date }): Promise<Filme[]>;
  buscarPorId(id: number): Promise<Filme | null>;
  criar(dados: DadosFilme): Promise<Filme>;
  atualizar(id: number, dados: Partial<DadosFilme & { ativo: boolean }>): Promise<Filme>;
  remover(id: number): Promise<void>;
  contarSessoes(id: number): Promise<number>;
}

export interface SalaRepository {
  listar(): Promise<SalaResumo[]>;
  buscarPorId(id: number): Promise<SalaComAssentos | null>;
  buscarPorNome(nome: string): Promise<Sala | null>;
  criar(nome: string): Promise<Sala>;
  // chama a procedure sp_gerar_assentos_sala
  gerarAssentos(salaId: number, filas: number, assentosPorFila: number): Promise<void>;
  atualizar(id: number, dados: { nome?: string; ativa?: boolean }): Promise<Sala>;
  remover(id: number): Promise<void>;
}

export type FiltroSessoes = { filmeId?: number; salaId?: number; de?: Date; ate?: Date };

export interface SessaoRepository {
  listar(filtro: FiltroSessoes): Promise<SessaoDetalhada[]>;
  buscarPorId(id: number): Promise<SessaoDetalhada | null>;
  existeSobreposicao(salaId: number, inicio: Date, fim: Date, ignorarSessaoId?: number): Promise<boolean>;
  // a trigger do banco gera o mapa de assentos no insert
  criar(dados: { filmeId: number; salaId: number; inicio: Date; fim: Date; preco: number }): Promise<SessaoDetalhada>;
  atualizarPreco(id: number, preco: number): Promise<SessaoDetalhada>;
  remover(id: number): Promise<void>;
  contarReservas(id: number): Promise<number>;
}

// tabela assentos_sessao
export interface MapaAssentosRepository {
  listar(sessaoId: number): Promise<AssentoDaSessao[]>;
  // os métodos travar* só fazem sentido dentro de uma transação
  travar(sessaoId: number, assentoIds: number[]): Promise<AssentoDaSessao[]>;
  travarDaReserva(reservaId: number): Promise<AssentoDaSessao[]>;
  marcarReservados(sessaoId: number, assentoIds: number[], reservaId: number): Promise<number>;
  marcarVendidos(reservaId: number): Promise<number>;
  liberarDasReservas(reservaIds: number[]): Promise<number>;
  liberarVendidos(sessaoId: number, assentoIds: number[]): Promise<number>;
}

export interface ReservaRepository {
  criar(dados: {
    usuarioId: number;
    sessaoId: number;
    canal: CanalVenda;
    nomeCliente: string | null;
    criadaEm: Date;
    expiraEm: Date;
    valorTotal: number;
  }): Promise<Reserva>;
  buscarDetalhada(id: number): Promise<ReservaDetalhada | null>;
  travar(id: number): Promise<Reserva | null>;
  travarPendenteDoUsuario(usuarioId: number, sessaoId: number): Promise<Reserva | null>;
  atualizarStatus(id: number, status: StatusReserva, valorTotal?: number): Promise<void>;
  travarVencidas(agora: Date, limite: number): Promise<number[]>;
  marcarStatus(ids: number[], status: StatusReserva): Promise<number>;
  descontarValor(id: number, valor: number): Promise<void>;
}

export interface PagamentoRepository {
  criar(dados: { reservaId: number; valor: number; transacao: string; pagoEm: Date }): Promise<void>;
}

export interface IngressoRepository {
  criarVarios(
    itens: { codigo: string; reservaId: number; sessaoId: number; assentoId: number; valor: number; emitidoEm: Date }[],
  ): Promise<void>;
  listarDoUsuario(usuarioId: number): Promise<IngressoDetalhado[]>;
  buscarPorCodigo(codigo: string): Promise<IngressoDetalhado | null>;
  travarPorCodigo(codigo: string): Promise<IngressoDetalhado | null>;
  marcarUtilizado(id: number, quando: Date, operadorId: number): Promise<void>;
  travarPorCodigos(codigos: string[]): Promise<IngressoDetalhado[]>;
  marcarCancelados(ids: number[]): Promise<void>;
}

export interface RelatorioRepository {
  ocupacao(inicio: Date, fim: Date, filmeId?: number): Promise<LinhaOcupacao[]>;
  vendasPorCanal(inicio: Date, fim: Date): Promise<VendasPorCanal[]>;
  verificarConexao(): Promise<boolean>;
}

export type Repositorios = {
  usuarios: UsuarioRepository;
  filmes: FilmeRepository;
  salas: SalaRepository;
  sessoes: SessaoRepository;
  mapa: MapaAssentosRepository;
  reservas: ReservaRepository;
  pagamentos: PagamentoRepository;
  ingressos: IngressoRepository;
  relatorios: RelatorioRepository;
};

// Roda o callback numa transação. Se der erro faz rollback, senão commit.
// Assim o service controla a transação sem importar o Prisma.
export interface UnidadeDeTrabalho {
  executar<T>(trabalho: (repos: Repositorios) => Promise<T>): Promise<T>;
}
