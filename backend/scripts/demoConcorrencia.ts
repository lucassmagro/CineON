// Demonstração da disputa pelo mesmo assento, pra rodar na apresentação.
//   npm run demo:concorrencia -- https://api.seu-dominio.com 20
// Loga N clientes de teste, pega um assento livre da próxima sessão, manda todo mundo
// reservar ao mesmo tempo e no fim desfaz a reserva que ganhou.
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const pessoas = Number(process.argv[3] ?? 20);

async function chamar(metodo: string, caminho: string, corpo?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${base}${caminho}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  const texto = await r.text();
  return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
}

async function entrar(i: number): Promise<string> {
  const email = `demo${i}@cineon.demo`;
  const senha = "demo-concorrencia";
  let r = await chamar("POST", "/auth/login", { email, senha });
  if (r.status !== 200) {
    await chamar("POST", "/auth/cadastro", { nome: `Pessoa Demo ${i}`, email, senha });
    r = await chamar("POST", "/auth/login", { email, senha });
  }
  return r.corpo.accessToken as string;
}

async function main() {
  console.log(`API: ${base} | ${pessoas} pessoas`);
  const tokens = await Promise.all(Array.from({ length: pessoas }, (_, i) => entrar(i + 1)));

  const sessoes = await chamar("GET", "/sessoes");
  let alvo: { sessaoId: number; assentoId: number; rotulo: string; descricao: string } | null = null;
  for (const s of sessoes.corpo as any[]) {
    const mapa = await chamar("GET", `/sessoes/${s.id}/assentos`);
    for (const f of mapa.corpo.filas) {
      const livre = f.assentos.find((a: any) => a.status === "LIVRE");
      if (livre) {
        alvo = { sessaoId: s.id, assentoId: livre.id, rotulo: `${f.fila}${livre.numero}`, descricao: `${s.filme.titulo} — ${s.sala.nome} — ${new Date(s.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` };
        break;
      }
    }
    if (alvo) break;
  }
  if (!alvo) throw new Error("Nenhuma sessão futura com assento livre");

  console.log(`Sessão: ${alvo.descricao} | assento disputado: ${alvo.rotulo}`);
  const inicio = Date.now();
  const respostas = await Promise.all(
    tokens.map((t) => chamar("POST", "/reservas", { sessaoId: alvo!.sessaoId, assentoIds: [alvo!.assentoId] }, t)),
  );
  const ms = Date.now() - inicio;

  const vencedora = respostas.findIndex((r) => r.status === 201);
  const placar = respostas.reduce<Record<number, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log(`Resultado em ${ms} ms:`, placar);
  console.log(vencedora >= 0 ? `Venceu: Pessoa Demo ${vencedora + 1}` : "Nenhuma reserva aceita");

  if (vencedora >= 0) {
    await chamar("DELETE", `/reservas/${respostas[vencedora]!.corpo.id}`, undefined, tokens[vencedora]);
    console.log(`Reserva desfeita: o assento ${alvo.rotulo} está livre de novo.`);
  }
  const ok = placar[201] === 1 && placar[409] === pessoas - 1;
  console.log(ok ? "✔ Um assento, um comprador." : "✖ Resultado inesperado!");
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
