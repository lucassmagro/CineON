// Sobe a API numa porta aleatória com um relógio que dá pra adiantar (teste de expiração).
import type { Server } from "node:http";
import { criarApp } from "../src/app.js";
import { criarContainer } from "../src/container.js";
import { prisma } from "../src/prisma.js";

process.env.NODE_ENV = "test";

export type Api = {
  base: string;
  servidor: Server;
  avancarMinutos(min: number): void;
  container: ReturnType<typeof criarContainer>;
};

export async function subirApi(): Promise<Api> {
  let deslocamentoMs = 0;
  const container = criarContainer({ relogio: () => new Date(Date.now() + deslocamentoMs) });
  const servidor = criarApp(container).listen(0);
  await new Promise((ok) => servidor.once("listening", ok));
  const porta = (servidor.address() as { port: number }).port;
  return {
    base: `http://127.0.0.1:${porta}`,
    servidor,
    container,
    avancarMinutos: (min) => {
      deslocamentoMs += min * 60_000;
    },
  };
}

export type Resposta<T = any> = { status: number; corpo: T };

export async function chamar<T = any>(
  api: Api,
  metodo: string,
  caminho: string,
  opcoes: { token?: string; corpo?: unknown } = {},
): Promise<Resposta<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opcoes.token) headers.Authorization = `Bearer ${opcoes.token}`;
  const r = await fetch(`${api.base}${caminho}`, {
    method: metodo,
    headers,
    ...(opcoes.corpo !== undefined ? { body: JSON.stringify(opcoes.corpo) } : {}),
  });
  const texto = await r.text();
  return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
}

export const sufixo = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export async function novoCliente(api: Api, nome = "Cliente Teste"): Promise<{ token: string; id: number; email: string }> {
  const email = `teste_${sufixo()}@teste.com`;
  const cad = await chamar(api, "POST", "/auth/cadastro", { corpo: { nome, email, senha: "senha123" } });
  if (cad.status !== 201) throw new Error(`cadastro falhou: ${cad.status}`);
  const login = await chamar(api, "POST", "/auth/login", { corpo: { email, senha: "senha123" } });
  return { token: login.corpo.accessToken, id: login.corpo.usuario.id, email };
}

export async function tokenOperador(api: Api): Promise<string> {
  const r = await chamar(api, "POST", "/auth/login", { corpo: { email: "operador@cineon.com", senha: "cineon123" } });
  if (r.status !== 200) throw new Error("Rode `npm run seed` antes dos testes (operador@cineon.com)");
  return r.corpo.accessToken;
}

// cria sala, filme e sessão pela própria API
export async function cenario(api: Api, operador: string, opcoes: { filas?: number; porFila?: number; minutosAteInicio?: number } = {}) {
  const s = sufixo();
  const sala = await chamar(api, "POST", "/salas", {
    token: operador,
    corpo: { nome: `Sala Teste ${s}`, filas: opcoes.filas ?? 3, assentosPorFila: opcoes.porFila ?? 4 },
  });
  if (sala.status !== 201) throw new Error(`sala: ${sala.status} ${JSON.stringify(sala.corpo)}`);
  const filme = await chamar(api, "POST", "/filmes", {
    token: operador,
    corpo: { titulo: `Filme Teste ${s}`, duracaoMin: 90, classificacao: "L", genero: "Teste" },
  });
  const inicio = new Date(Date.now() + (opcoes.minutosAteInicio ?? 30) * 60_000).toISOString();
  const sessao = await chamar(api, "POST", "/sessoes", {
    token: operador,
    corpo: { filmeId: filme.corpo.id, salaId: sala.corpo.id, inicio, preco: 25.5 },
  });
  if (sessao.status !== 201) throw new Error(`sessão: ${sessao.status} ${JSON.stringify(sessao.corpo)}`);
  const mapa = await chamar(api, "GET", `/sessoes/${sessao.corpo.id}/assentos`);
  const assentos: { id: number; rotulo: string }[] = mapa.corpo.filas.flatMap((f: any) =>
    f.assentos.map((a: any) => ({ id: a.id, rotulo: `${f.fila}${a.numero}` })),
  );
  return { salaId: sala.corpo.id as number, filmeId: filme.corpo.id as number, sessaoId: sessao.corpo.id as number, assentos };
}

// apaga o que os testes criaram (nomes com "Teste" e e-mails @teste.com)
export async function limparDadosDeTeste(): Promise<void> {
  const sessoes = await prisma.sessao.findMany({ where: { filme: { titulo: { startsWith: "Filme Teste" } } }, select: { id: true } });
  const ids = sessoes.map((s) => s.id);
  await prisma.ingresso.deleteMany({ where: { sessaoId: { in: ids } } });
  await prisma.pagamento.deleteMany({ where: { reserva: { sessaoId: { in: ids } } } });
  await prisma.assentoSessao.deleteMany({ where: { sessaoId: { in: ids } } });
  await prisma.reserva.deleteMany({ where: { sessaoId: { in: ids } } });
  await prisma.sessao.deleteMany({ where: { id: { in: ids } } });
  await prisma.filme.deleteMany({ where: { titulo: { startsWith: "Filme Teste" } } });
  await prisma.sala.deleteMany({ where: { nome: { startsWith: "Sala Teste" } } });
  await prisma.usuario.deleteMany({ where: { email: { endsWith: "@teste.com" } } });
}

export async function encerrar(api: Api): Promise<void> {
  await limparDadosDeTeste();
  api.servidor.close();
  await prisma.$disconnect();
}
