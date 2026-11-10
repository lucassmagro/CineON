// Testes de integração. Usam o banco do .env, então rode o seed antes.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { type Api, cenario, chamar, encerrar, novoCliente, subirApi, sufixo, tokenOperador } from "./apoio.js";

let api: Api;
let operador: string;

before(async () => {
  api = await subirApi();
  operador = await tokenOperador(api);
});
after(() => encerrar(api));

test("autenticação: cadastro, login, /auth/me e erros", async () => {
  const email = `teste_${sufixo()}@teste.com`;
  let r = await chamar(api, "POST", "/auth/cadastro", { corpo: { nome: "Fulano", email, senha: "senha123" } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.papel, "CLIENTE");
  assert.equal(r.corpo.senhaHash, undefined);

  r = await chamar(api, "POST", "/auth/cadastro", { corpo: { nome: "Fulano", email, senha: "senha123" } });
  assert.equal(r.status, 409);

  r = await chamar(api, "POST", "/auth/login", { corpo: { email, senha: "errada" } });
  assert.equal(r.status, 401);

  r = await chamar(api, "POST", "/auth/login", { corpo: { email, senha: "senha123" } });
  assert.equal(r.status, 200);
  const token = r.corpo.accessToken as string;

  r = await chamar(api, "GET", "/auth/me", { token });
  assert.equal(r.corpo.email, email);
  r = await chamar(api, "GET", "/auth/me", { token: "lixo" });
  assert.equal(r.status, 401);

  r = await chamar(api, "GET", "/salas", { token });
  assert.equal(r.status, 403);
  r = await chamar(api, "POST", "/auth/cadastro", { corpo: { nome: "X", email: "invalido", senha: "1" } });
  assert.equal(r.status, 400);
});

test("gerência: sala gera assentos (procedure), sessão gera mapa (trigger), sem sobreposição", async () => {
  const c = await cenario(api, operador, { filas: 3, porFila: 4 });
  assert.equal(c.assentos.length, 12);
  assert.deepEqual(c.assentos.slice(0, 2).map((a) => a.rotulo), ["A1", "A2"]);

  const sala = await chamar(api, "GET", `/salas/${c.salaId}`, { token: operador });
  assert.equal(sala.corpo.capacidade, 12);
  assert.equal(sala.corpo.filas, 3);

  const sessao = await chamar(api, "GET", `/sessoes/${c.sessaoId}`);
  const r = await chamar(api, "POST", "/sessoes", {
    token: operador,
    corpo: { filmeId: c.filmeId, salaId: c.salaId, inicio: sessao.corpo.fim, preco: 10 },
  });
  assert.equal(r.status, 201, "começando exatamente no fim da anterior é permitido");
  const sobreposta = await chamar(api, "POST", "/sessoes", {
    token: operador,
    corpo: { filmeId: c.filmeId, salaId: c.salaId, inicio: sessao.corpo.inicio, preco: 10 },
  });
  assert.equal(sobreposta.status, 409);

  const passada = await chamar(api, "POST", "/sessoes", {
    token: operador,
    corpo: { filmeId: c.filmeId, salaId: c.salaId, inicio: new Date(Date.now() - 60_000).toISOString(), preco: 10 },
  });
  assert.equal(passada.status, 422);

  const del = await chamar(api, "DELETE", `/salas/${c.salaId}`, { token: operador });
  assert.equal(del.status, 409);
});

test("fluxo completo: reserva -> pagamento -> ingressos -> validação na entrada", async () => {
  const c = await cenario(api, operador);
  const ana = await novoCliente(api, "Ana");
  const bia = await novoCliente(api, "Bia");
  const [a1, a2] = c.assentos;

  let r = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [a1!.id, a2!.id] } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.status, "PENDENTE");
  assert.equal(r.corpo.valorTotal, 51); // 2 x 25,50
  const reservaId = r.corpo.id as number;

  let mapa = await chamar(api, "GET", `/sessoes/${c.sessaoId}/assentos`, { token: ana.token });
  const linhaA = mapa.corpo.filas[0].assentos;
  assert.equal(linhaA[0].status, "RESERVADO");
  assert.equal(linhaA[0].minhaReserva, true);
  assert.equal(mapa.corpo.resumo.reservados, 2);

  r = await chamar(api, "POST", "/reservas", { token: bia.token, corpo: { sessaoId: c.sessaoId, assentoIds: [a2!.id] } });
  assert.equal(r.status, 409);
  assert.deepEqual(r.corpo.detalhes.assentos, [a2!.rotulo]);

  r = await chamar(api, "POST", `/reservas/${reservaId}/pagamento`, { token: bia.token });
  assert.equal(r.status, 403);

  r = await chamar(api, "POST", `/reservas/${reservaId}/pagamento`, { token: ana.token });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.status, "PAGA");
  assert.equal(r.corpo.ingressos.length, 2);
  const codigos = r.corpo.ingressos.map((i: { codigo: string }) => i.codigo);
  assert.equal(new Set(codigos).size, 2);

  r = await chamar(api, "POST", `/reservas/${reservaId}/pagamento`, { token: ana.token });
  assert.equal(r.status, 409);

  mapa = await chamar(api, "GET", `/sessoes/${c.sessaoId}/assentos`);
  assert.equal(mapa.corpo.resumo.vendidos, 2);

  r = await chamar(api, "GET", "/ingressos/meus", { token: ana.token });
  assert.equal(r.corpo.length, 2);

  r = await chamar(api, "POST", "/ingressos/validacao", { token: ana.token, corpo: { codigo: codigos[0] } });
  assert.equal(r.status, 403);
  r = await chamar(api, "POST", "/ingressos/validacao", { token: operador, corpo: { codigo: codigos[0].toLowerCase() } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.status, "UTILIZADO");
  r = await chamar(api, "POST", "/ingressos/validacao", { token: operador, corpo: { codigo: codigos[0] } });
  assert.equal(r.status, 409);
  r = await chamar(api, "POST", "/ingressos/validacao", { token: operador, corpo: { codigo: "NAOEXISTE9" } });
  assert.equal(r.status, 404);

  const inicio = new Date(Date.now() - 60 * 60_000).toISOString();
  const fim = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  r = await chamar(api, "GET", `/relatorios/ocupacao?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}&filmeId=${c.filmeId}`, { token: operador });
  assert.equal(r.status, 200);
  const linha = r.corpo.sessoes.find((s: { sessaoId: number }) => s.sessaoId === c.sessaoId);
  assert.equal(linha.vendidos, 2);
  assert.equal(linha.utilizados, 1);
  assert.equal(linha.capacidade, 12);
  assert.equal(linha.receita, 51);

  r = await chamar(api, "GET", `/relatorios/vendas?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`, { token: operador });
  assert.equal(r.status, 200);
  assert.ok(r.corpo.porCanal.some((g: { canal: string }) => g.canal === "ONLINE"));

  r = await chamar(api, "DELETE", `/sessoes/${c.sessaoId}`, { token: operador });
  assert.equal(r.status, 409);
});

test("venda no balcão: operador reserva e paga (canal BALCAO)", async () => {
  const c = await cenario(api, operador);
  let r = await chamar(api, "POST", "/reservas", {
    token: operador,
    corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[5]!.id], nomeCliente: "Seu Jorge" },
  });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.canal, "BALCAO");
  assert.equal(r.corpo.nomeCliente, "Seu Jorge");
  r = await chamar(api, "POST", `/reservas/${r.corpo.id}/pagamento`, { token: operador });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.ingressos.length, 1);
});

test("expiração: reserva vencida libera os assentos e não pode ser paga", async () => {
  const c = await cenario(api, operador, { minutosAteInicio: 120 });
  const ana = await novoCliente(api);
  const bia = await novoCliente(api);
  const assento = c.assentos[0]!;

  let r = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [assento.id] } });
  assert.equal(r.status, 201);
  const reservaId = r.corpo.id;

  api.avancarMinutos(11);

  // antes do job rodar o mapa já mostra livre
  const mapa = await chamar(api, "GET", `/sessoes/${c.sessaoId}/assentos`);
  assert.equal(mapa.corpo.filas[0].assentos[0].status, "LIVRE");

  r = await chamar(api, "POST", `/reservas/${reservaId}/pagamento`, { token: ana.token });
  assert.equal(r.status, 410);

  r = await chamar(api, "POST", "/reservas", { token: bia.token, corpo: { sessaoId: c.sessaoId, assentoIds: [assento.id] } });
  assert.equal(r.status, 201);

  const expiradas = await api.container.services.reservas.expirarVencidas();
  assert.ok(expiradas >= 1);
  r = await chamar(api, "GET", `/reservas/${reservaId}`, { token: ana.token });
  assert.equal(r.corpo.status, "EXPIRADA");
});

test("desistir da reserva libera os assentos; nova reserva substitui a pendente anterior", async () => {
  const c = await cenario(api, operador);
  const ana = await novoCliente(api);
  let r = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[0]!.id] } });
  const primeira = r.corpo.id;
  r = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[1]!.id] } });
  assert.equal(r.status, 201);
  const segunda = r.corpo.id;

  r = await chamar(api, "GET", `/reservas/${primeira}`, { token: ana.token });
  assert.equal(r.corpo.status, "CANCELADA");

  r = await chamar(api, "DELETE", `/reservas/${segunda}`, { token: ana.token });
  assert.equal(r.status, 204);
  const mapa = await chamar(api, "GET", `/sessoes/${c.sessaoId}/assentos`);
  assert.equal(mapa.corpo.resumo.livres, 12);
});
