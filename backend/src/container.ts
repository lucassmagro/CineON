// Monta repositories, services e controllers passando as dependências pelo construtor.
// Os testes usam isso pra trocar o relógio e simular a passagem do tempo.
import { JWT_MINUTOS, JWT_SECRET, REGRAS, type ConfigRegras } from "./config.js";
import { AuthController } from "./controllers/AuthController.js";
import { FilmeController } from "./controllers/FilmeController.js";
import { IngressoController } from "./controllers/IngressoController.js";
import { RelatorioController } from "./controllers/RelatorioController.js";
import { ReservaController } from "./controllers/ReservaController.js";
import { SalaController } from "./controllers/SalaController.js";
import { SessaoController } from "./controllers/SessaoController.js";
import type { Relogio } from "./domain/modelos.js";
import { prisma } from "./prisma.js";
import { criarRepositorios, PrismaUnidadeDeTrabalho } from "./repositories/index.js";
import { AuthService } from "./services/AuthService.js";
import { FilmeService } from "./services/FilmeService.js";
import { IngressoService } from "./services/IngressoService.js";
import { PagamentoService } from "./services/PagamentoService.js";
import { RelatorioService } from "./services/RelatorioService.js";
import { ReservaService } from "./services/ReservaService.js";
import { SalaService } from "./services/SalaService.js";
import { SessaoService } from "./services/SessaoService.js";

export type OpcoesContainer = { relogio?: Relogio; regras?: Partial<ConfigRegras> };

export function criarContainer(opcoes: OpcoesContainer = {}) {
  const agora: Relogio = opcoes.relogio ?? (() => new Date());
  const regras: ConfigRegras = { ...REGRAS, ...opcoes.regras };

  const repos = criarRepositorios(prisma);
  const uow = new PrismaUnidadeDeTrabalho(prisma);

  const services = {
    auth: new AuthService(repos.usuarios, { jwtSecret: JWT_SECRET, jwtMinutos: JWT_MINUTOS }),
    filmes: new FilmeService(repos.filmes, repos.sessoes, agora),
    salas: new SalaService(repos.salas, uow),
    sessoes: new SessaoService(repos.sessoes, repos.filmes, repos.salas, repos.mapa, regras, agora),
    reservas: new ReservaService(uow, repos.reservas, regras, agora),
    pagamentos: new PagamentoService(uow, repos.reservas, agora),
    ingressos: new IngressoService(uow, repos.ingressos, regras, agora),
    relatorios: new RelatorioService(repos.relatorios),
  };

  const controllers = {
    auth: new AuthController(services.auth),
    filmes: new FilmeController(services.filmes),
    salas: new SalaController(services.salas),
    sessoes: new SessaoController(services.sessoes),
    reservas: new ReservaController(services.reservas, services.pagamentos),
    ingressos: new IngressoController(services.ingressos),
    relatorios: new RelatorioController(services.relatorios),
  };

  const verificarBanco = () => repos.relatorios.verificarConexao();

  return { services, controllers, verificarBanco };
}

export type Container = ReturnType<typeof criarContainer>;
