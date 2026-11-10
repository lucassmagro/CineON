// "Duas pessoas não podem comprar o mesmo assento da mesma sessão, nem que cliquem no mesmo instante."
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { prisma } from "../src/prisma.js";
import { type Api, cenario, chamar, encerrar, novoCliente, subirApi, tokenOperador } from "./apoio.js";

let api: Api;
let operador: string;
const PESSOAS = 20;

before(async () => {
  api = await subirApi();
  operador = await tokenOperador(api);
});
after(() => encerrar(api));

test(`${PESSOAS} pessoas clicam no MESMO assento ao mesmo tempo: só 1 consegue`, async () => {
  const c = await cenario(api, operador);
  const clientes = await Promise.all(Array.from({ length: PESSOAS }, (_, i) => novoCliente(api, `Pessoa ${i}`)));
  const assento = c.assentos[3]!;

  const respostas = await Promise.all(
    clientes.map((cl) => chamar(api, "POST", "/reservas", { token: cl.token, corpo: { sessaoId: c.sessaoId, assentoIds: [assento.id] } })),
  );

  const sucessos = respostas.filter((r) => r.status === 201);
  const conflitos = respostas.filter((r) => r.status === 409);
  assert.equal(sucessos.length, 1, "exatamente uma reserva deve ser aceita");
  assert.equal(conflitos.length, PESSOAS - 1, "as demais recebem 409 (assento indisponível)");

  const linha = await prisma.assentoSessao.findUnique({
    where: { sessaoId_assentoId: { sessaoId: c.sessaoId, assentoId: assento.id } },
  });
  assert.equal(linha?.status, "RESERVADO");
  assert.equal(linha?.reservaId, sucessos[0]!.corpo.id);
});

test("pedidos simultâneos com assentos cruzados não geram deadlock nem venda dupla", async () => {
  const c = await cenario(api, operador);
  const [x, y, z] = c.assentos;
  const clientes = await Promise.all([novoCliente(api), novoCliente(api), novoCliente(api)]);
  // ordens diferentes de propósito, pra ver se dá deadlock
  const pedidos = [
    [x!.id, y!.id],
    [y!.id, x!.id],
    [z!.id, y!.id, x!.id],
  ];
  const respostas = await Promise.all(
    pedidos.map((ids, i) => chamar(api, "POST", "/reservas", { token: clientes[i]!.token, corpo: { sessaoId: c.sessaoId, assentoIds: ids } })),
  );
  assert.equal(respostas.filter((r) => r.status === 201).length, 1);
  assert.equal(respostas.filter((r) => r.status === 409).length, 2);
  assert.equal(respostas.filter((r) => r.status >= 500).length, 0);
});

test("dois pagamentos simultâneos da mesma reserva: só um emite ingressos", async () => {
  const c = await cenario(api, operador);
  const ana = await novoCliente(api);
  const reserva = await chamar(api, "POST", "/reservas", {
    token: ana.token,
    corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[0]!.id, c.assentos[1]!.id] },
  });
  const respostas = await Promise.all(
    Array.from({ length: 5 }, () => chamar(api, "POST", `/reservas/${reserva.corpo.id}/pagamento`, { token: ana.token })),
  );
  assert.equal(respostas.filter((r) => r.status === 201).length, 1);
  assert.equal(respostas.filter((r) => r.status === 409).length, 4);
  assert.equal(await prisma.ingresso.count({ where: { reservaId: reserva.corpo.id } }), 2);
});

test("duas validações simultâneas do mesmo ingresso: só uma passa", async () => {
  const c = await cenario(api, operador);
  const ana = await novoCliente(api);
  const reserva = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[0]!.id] } });
  const paga = await chamar(api, "POST", `/reservas/${reserva.corpo.id}/pagamento`, { token: ana.token });
  const codigo = paga.corpo.ingressos[0].codigo;
  const respostas = await Promise.all(
    Array.from({ length: 4 }, () => chamar(api, "POST", "/ingressos/validacao", { token: operador, corpo: { codigo } })),
  );
  assert.equal(respostas.filter((r) => r.status === 200).length, 1);
  assert.equal(respostas.filter((r) => r.status === 409).length, 3);
});

test("cancelamentos simultâneos do mesmo ingresso: só um passa e o valor é estornado uma vez", async () => {
  const c = await cenario(api, operador, { minutosAteInicio: 120 });
  const ana = await novoCliente(api);
  const reserva = await chamar(api, "POST", "/reservas", {
    token: ana.token,
    corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[0]!.id, c.assentos[1]!.id] },
  });
  const paga = await chamar(api, "POST", `/reservas/${reserva.corpo.id}/pagamento`, { token: ana.token });
  const codigo = paga.corpo.ingressos[0].codigo;
  const respostas = await Promise.all(
    Array.from({ length: 4 }, () => chamar(api, "POST", "/ingressos/cancelamento", { token: ana.token, corpo: { codigos: [codigo] } })),
  );
  assert.equal(respostas.filter((r) => r.status === 200).length, 1);
  assert.equal(respostas.filter((r) => r.status === 409).length, 3);
  const depois = await prisma.reserva.findUnique({ where: { id: reserva.corpo.id } });
  assert.equal(Number(depois?.valorTotal), 25.5);
});

test("última barreira: o banco recusa um segundo ingresso para o mesmo assento", async () => {
  const c = await cenario(api, operador);
  const ana = await novoCliente(api);
  const reserva = await chamar(api, "POST", "/reservas", { token: ana.token, corpo: { sessaoId: c.sessaoId, assentoIds: [c.assentos[0]!.id] } });
  await chamar(api, "POST", `/reservas/${reserva.corpo.id}/pagamento`, { token: ana.token });

  // inserindo direto no banco, sem passar pelo service
  await assert.rejects(
    prisma.ingresso.create({
      data: { codigo: "DUPLICADO2", reservaId: reserva.corpo.id, sessaoId: c.sessaoId, assentoId: c.assentos[0]!.id, valor: 1 },
    }),
    (e: { code?: string }) => e.code === "P2002",
  );
});
