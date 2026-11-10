import { Router } from "express";
import type { Container } from "../container.js";
import { criarMiddlewaresAuth } from "../middlewares/autenticacao.js";

export function criarRotas({ controllers: c, services }: Container): Router {
  const { autenticar, autenticarOpcional, exigirOperador } = criarMiddlewaresAuth(services.auth);
  const operador = [autenticar, exigirOperador];
  const r = Router();

  // auth
  r.post("/auth/cadastro", c.auth.cadastrar);
  r.post("/auth/login", c.auth.login);
  r.get("/auth/me", autenticar, c.auth.eu);
  r.post("/usuarios/operadores", ...operador, c.auth.criarOperador);

  // filmes
  r.get("/filmes", c.filmes.listar);
  r.get("/filmes/:id", c.filmes.buscar);
  r.post("/filmes", ...operador, c.filmes.criar);
  r.put("/filmes/:id", ...operador, c.filmes.atualizar);
  r.delete("/filmes/:id", ...operador, c.filmes.remover);

  // salas
  r.get("/salas", ...operador, c.salas.listar);
  r.get("/salas/:id", ...operador, c.salas.buscar);
  r.post("/salas", ...operador, c.salas.criar);
  r.put("/salas/:id", ...operador, c.salas.atualizar);
  r.delete("/salas/:id", ...operador, c.salas.remover);

  // sessões
  r.get("/sessoes", c.sessoes.listar);
  r.get("/sessoes/:id", c.sessoes.buscar);
  r.get("/sessoes/:id/assentos", autenticarOpcional, c.sessoes.mapa);
  r.post("/sessoes", ...operador, c.sessoes.criar);
  r.put("/sessoes/:id", ...operador, c.sessoes.atualizar);
  r.delete("/sessoes/:id", ...operador, c.sessoes.remover);

  // reservas (cliente no app ou operador no balcão)
  r.post("/reservas", autenticar, c.reservas.criar);
  r.get("/reservas/:id", autenticar, c.reservas.buscar);
  r.delete("/reservas/:id", autenticar, c.reservas.cancelar);
  r.post("/reservas/:id/pagamento", autenticar, c.reservas.pagar);

  // ingressos
  r.get("/ingressos/meus", autenticar, c.ingressos.meus);
  r.post("/ingressos/validacao", ...operador, c.ingressos.validar);
  r.get("/ingressos/:codigo", autenticar, c.ingressos.buscar);

  // relatórios
  r.get("/relatorios/ocupacao", ...operador, c.relatorios.ocupacao);
  r.get("/relatorios/vendas", ...operador, c.relatorios.vendas);

  return r;
}
