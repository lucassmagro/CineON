// Dados de demonstração: 1 operador, 2 clientes (senha cineon123 ou SEED_SENHA), 3 salas, 6 filmes,
// sessões de 3 dias atrás até 7 dias à frente e algumas vendas pro relatório ter números.
// Se já existir usuário no banco ela não faz nada.
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/prisma.js";
import { gerarCodigoIngresso, multiplicarDinheiro, somarMinutos } from "../src/domain/valores.js";

const LIMPEZA_MIN = Number(process.env.LIMPEZA_SALA_MIN ?? 15);
// em produção passe SEED_SENHA, senão qualquer um que leia o repositório entra como operador
const SENHA = process.env.SEED_SENHA || "cineon123";

// aleatório com semente fixa, pra seed gerar sempre os mesmos dados
let estado = 20261124;
function aleatorio(): number {
  estado = (estado * 1103515245 + 12345) % 2147483648;
  return estado / 2147483648;
}
function inteiroEntre(min: number, max: number): number {
  return min + Math.floor(aleatorio() * (max - min + 1));
}

function horario(dias: number, hhmm: string): Date {
  const hoje = new Date(Date.now() - 3 * 60 * 60_000).toISOString().slice(0, 10); // dia de hoje no horário de Brasília
  const base = new Date(`${hoje}T${hhmm}:00-03:00`);
  return new Date(base.getTime() + dias * 24 * 60 * 60_000);
}

async function main() {
  if ((await prisma.usuario.count()) > 0) {
    console.log("O banco já possui dados: seed ignorada (nada foi alterado).");
    return;
  }

  // usuários
  const senhaHash = await bcrypt.hash(SENHA, 10);
  const operador = await prisma.usuario.create({
    data: { nome: "Operador CineON", email: "operador@cineon.com", senhaHash, papel: "OPERADOR" },
  });
  const ana = await prisma.usuario.create({
    data: { nome: "Ana Souza", email: "ana@cineon.com", senhaHash, papel: "CLIENTE" },
  });
  const bruno = await prisma.usuario.create({
    data: { nome: "Bruno Lima", email: "bruno@cineon.com", senhaHash, papel: "CLIENTE" },
  });
  const clientes = [ana, bruno];

  // salas
  const layouts = [
    { nome: "Sala 1", filas: 8, porFila: 12 },
    { nome: "Sala 2", filas: 6, porFila: 10 },
    { nome: "Sala 3", filas: 5, porFila: 8 },
  ];
  const salas = [];
  for (const l of layouts) {
    const sala = await prisma.sala.create({ data: { nome: l.nome } });
    await prisma.$executeRaw`CALL sp_gerar_assentos_sala(${sala.id}::int, ${l.filas}::int, ${l.porFila}::int)`;
    salas.push(sala);
  }

  // filmes
  const filmes = await Promise.all(
    [
      { titulo: "Velozes e Compilados", posterUrl: "/posteres/velozes-e-compilados.jpg", genero: "Ação", duracaoMin: 128, classificacao: "14", sinopse: "Um desenvolvedor tem até sexta às 18h para colocar o sistema no ar, e cada build leva quarenta minutos." },
      { titulo: "Forrest Commit", posterUrl: "/posteres/forrest-commit.jpg", genero: "Drama", duracaoMin: 112, classificacao: "12", sinopse: "Um estagiário de bom coração faz commits direto na main e, sem querer, muda a história da empresa." },
      { titulo: "Procurando o Bug", posterUrl: "/posteres/procurando-o-bug.jpg", genero: "Animação", duracaoMin: 95, classificacao: "L", sinopse: "Um peixinho testador atravessa um oceano de logs para encontrar o bug que derrubou a produção." },
      { titulo: "O Silêncio dos Servidores", posterUrl: "/posteres/o-silencio-dos-servidores.jpg", genero: "Suspense", duracaoMin: 104, classificacao: "16", sinopse: "Às três da manhã todos os servidores param de responder, e o plantonista descobre que não está sozinho no datacenter." },
      { titulo: "O Poderoso Chatbot", posterUrl: "/posteres/o-poderoso-chatbot.jpg", genero: "Comédia", duracaoMin: 99, classificacao: "10", sinopse: "O patriarca de uma família de assistentes virtuais dá respostas que ninguém consegue recusar." },
      { titulo: "De Volta para o Backup", posterUrl: "/posteres/de-volta-para-o-backup.jpg", genero: "Ficção científica", duracaoMin: 141, classificacao: "12", sinopse: "Um técnico viaja no tempo para restaurar o backup antes que a cidade inteira perca seus arquivos." },
    ].map((f) => prisma.filme.create({ data: f })),
  );

  // sessões
  const horarios = ["14:00", "17:30", "21:00"];
  const precos: Record<string, number> = { "14:00": 22, "17:30": 28, "21:00": 32 };
  let indiceFilme = 0;
  const sessoes: { id: number; inicio: Date; preco: number; salaId: number }[] = [];

  for (let dia = -3; dia <= 7; dia++) {
    for (const sala of salas) {
      for (const hora of horarios) {
        const filme = filmes[indiceFilme++ % filmes.length]!;
        const inicio = horario(dia, hora);
        const sessao = await prisma.sessao.create({
          data: {
            filmeId: filme.id,
            salaId: sala.id,
            inicio,
            fim: somarMinutos(inicio, filme.duracaoMin + LIMPEZA_MIN),
            preco: precos[hora]!,
          },
        });
        sessoes.push({ id: sessao.id, inicio, preco: precos[hora]!, salaId: sala.id });
      }
    }
  }

  // vendas
  const agora = new Date();
  let totalIngressos = 0;
  for (const sessao of sessoes) {
    const passada = sessao.inicio < agora;
    const diasAteSessao = (sessao.inicio.getTime() - agora.getTime()) / 86_400_000;
    if (diasAteSessao > 2) continue;

    const mapa = await prisma.assentoSessao.findMany({ where: { sessaoId: sessao.id }, select: { assentoId: true } });
    const ocupacao = passada ? 0.25 + aleatorio() * 0.6 : 0.05 + aleatorio() * 0.3;
    const quantidade = Math.floor(mapa.length * ocupacao);
    const escolhidos = mapa.sort(() => aleatorio() - 0.5).slice(0, quantidade).map((a) => a.assentoId);

    // compras de 1 a 4 assentos
    for (let i = 0; i < escolhidos.length; ) {
      const grupo = escolhidos.slice(i, i + inteiroEntre(1, 4));
      i += grupo.length;
      const balcao = aleatorio() < 0.3;
      const cliente = clientes[inteiroEntre(0, clientes.length - 1)]!;
      const compradaEm = somarMinutos(sessao.inicio, -inteiroEntre(30, 2 * 24 * 60));
      const criadaEm = compradaEm < agora ? compradaEm : somarMinutos(agora, -60);
      const valorTotal = multiplicarDinheiro(sessao.preco, grupo.length);

      const reserva = await prisma.reserva.create({
        data: {
          usuarioId: balcao ? operador.id : cliente.id,
          sessaoId: sessao.id,
          status: "PAGA",
          canal: balcao ? "BALCAO" : "ONLINE",
          nomeCliente: balcao ? "Cliente no balcão" : null,
          criadaEm,
          expiraEm: somarMinutos(criadaEm, 10),
          valorTotal,
          pagamento: { create: { valor: valorTotal, transacao: randomUUID(), pagoEm: somarMinutos(criadaEm, 2) } },
        },
      });
      await prisma.assentoSessao.updateMany({
        where: { sessaoId: sessao.id, assentoId: { in: grupo } },
        data: { status: "VENDIDO", reservaId: reserva.id },
      });
      const utilizado = passada && aleatorio() < 0.9;
      await prisma.ingresso.createMany({
        data: grupo.map((assentoId) => ({
          codigo: gerarCodigoIngresso(),
          reservaId: reserva.id,
          sessaoId: sessao.id,
          assentoId,
          valor: sessao.preco,
          emitidoEm: somarMinutos(criadaEm, 2),
          status: utilizado ? ("UTILIZADO" as const) : ("VALIDO" as const),
          utilizadoEm: utilizado ? somarMinutos(sessao.inicio, -inteiroEntre(1, 30)) : null,
          validadoPorId: utilizado ? operador.id : null,
        })),
      });
      totalIngressos += grupo.length;
    }
  }

  console.log(
    `Seed concluída: 3 usuários, ${salas.length} salas, ${filmes.length} filmes, ${sessoes.length} sessões, ${totalIngressos} ingressos.`,
  );
  const aviso = process.env.SEED_SENHA ? "a de SEED_SENHA" : "cineon123";
  console.log(`Logins (senha ${aviso}): operador@cineon.com | ana@cineon.com | bruno@cineon.com`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
