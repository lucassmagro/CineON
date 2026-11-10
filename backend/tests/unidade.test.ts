import assert from "node:assert/strict";
import { test } from "node:test";
import type { AssentoDaSessao } from "../src/domain/modelos.js";
import { gerarCodigoIngresso, multiplicarDinheiro, normalizarCodigo, TAMANHO_CODIGO } from "../src/domain/valores.js";
import { estaDisponivel, statusEfetivo } from "../src/services/regrasAssento.js";

const agora = new Date("2026-11-24T19:00:00-03:00");
const base: AssentoDaSessao = {
  assentoId: 1,
  fila: "A",
  numero: 1,
  status: "LIVRE",
  reservaId: null,
  reservaStatus: null,
  reservaExpiraEm: null,
  reservaUsuarioId: null,
};

test("disponibilidade do assento (RN01, RN02, RN03)", () => {
  assert.equal(estaDisponivel(base, agora), true);
  assert.equal(estaDisponivel({ ...base, status: "VENDIDO", reservaId: 1, reservaStatus: "PAGA" }, agora), false);

  const reservado = { ...base, status: "RESERVADO" as const, reservaId: 1, reservaStatus: "PENDENTE" as const };
  assert.equal(estaDisponivel({ ...reservado, reservaExpiraEm: new Date(agora.getTime() + 60_000) }, agora), false);
  assert.equal(estaDisponivel({ ...reservado, reservaExpiraEm: new Date(agora.getTime() - 1) }, agora), true);
  assert.equal(estaDisponivel({ ...reservado, reservaExpiraEm: agora }, agora), true, "vence exatamente no prazo");
  assert.equal(statusEfetivo({ ...reservado, reservaExpiraEm: new Date(agora.getTime() - 1) }, agora), "LIVRE");
  assert.equal(estaDisponivel({ ...reservado, reservaStatus: "CANCELADA" }, agora), true);
  assert.equal(estaDisponivel({ ...reservado, reservaStatus: null }, agora), false);
});

test("código do ingresso: tamanho, alfabeto sem ambíguos e normalização", () => {
  const codigos = new Set(Array.from({ length: 2000 }, gerarCodigoIngresso));
  assert.equal(codigos.size, 2000);
  for (const c of codigos) {
    assert.equal(c.length, TAMANHO_CODIGO);
    assert.match(c, /^[A-HJ-KM-NP-Z2-9]+$/);
  }
  assert.equal(normalizarCodigo(" k7qx-3m9p za "), "K7QX3M9PZA");
});

test("dinheiro calculado em centavos", () => {
  assert.equal(multiplicarDinheiro(25.5, 3), 76.5);
  assert.equal(multiplicarDinheiro(0.1, 3), 0.3);
});
