# CineON — Definição da API

- **Base**: `https://api.cineon.agp.app.br` (produção, também em `https://cineon.agp.app.br/api`) · `http://localhost:3000` (desenvolvimento)
- **Formato**: JSON (UTF-8). Datas em ISO-8601; valores em reais (`number` com 2 casas)
- **Autenticação**: `Authorization: Bearer <accessToken>` (JWT, obtido em `POST /auth/login`)
- **Acesso**: 🔓 público · 👤 autenticado (cliente ou operador) · 🛠 somente `OPERADOR`
- Exemplos executáveis em [backend/requisicoes.http](../backend/requisicoes.http) (extensão REST Client do VS Code)

## Erros

Todas as respostas de erro têm o formato:

```json
{ "message": "O assento C7 acabou de ficar indisponível", "codigo": "AssentoIndisponivel", "detalhes": { "assentos": ["C7"] } }
```

`400` dados inválidos (com `erros: [{ campo, problema }]`) · `401` sem login/token inválido · `403` sem permissão · `404` não encontrado · `409` conflito · `410` reserva expirada · `422` regra de negócio violada · `500` erro interno (sem detalhes)

## Endpoints

### Autenticação

| Verbo | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/cadastro` | 🔓 | `{ nome, email, senha }` | 201 `Usuario` · 409 e-mail em uso |
| POST | `/auth/login` | 🔓 | `{ email, senha }` | 200 `{ usuario, accessToken }` · 401 |
| GET | `/auth/me` | 👤 | — | 200 `Usuario` |
| POST | `/usuarios/operadores` | 🛠 | `{ nome, email, senha }` | 201 `Usuario` (papel OPERADOR) |

`Usuario = { id, nome, email, papel: "CLIENTE" | "OPERADOR" }` (o hash da senha nunca é devolvido)

### Filmes

| Verbo | Rota | Acesso | Corpo / Query | Resposta |
|---|---|---|---|---|
| GET | `/filmes` | 🔓 | `?emCartaz=true` (só ativos com sessão futura) | 200 `Filme[]` |
| GET | `/posteres/:arquivo` | 🔓 | — | 200 imagem JPEG (pôsteres da seed, cache de 7 dias) |
| GET | `/filmes/:id` | 🔓 | — | 200 `Filme & { sessoes: Sessao[] }` (próximas) |
| POST | `/filmes` | 🛠 | `{ titulo, sinopse?, duracaoMin, classificacao: "L"\|"10"\|"12"\|"14"\|"16"\|"18", genero, posterUrl? }` | 201 `Filme` |
| PUT | `/filmes/:id` | 🛠 | campos parciais + `ativo?` (`posterUrl: ""` tira o pôster) | 200 `Filme` · 409 (duração com sessões) |
| DELETE | `/filmes/:id` | 🛠 | — | 204 · 409 se tiver sessões |
| POST | `/filmes/poster` | 🛠 | corpo **cru** com a imagem (`Content-Type: image/jpeg`, `image/png` ou `image/webp`, até 5 MB) | 201 `{ posterUrl: "/posteres/upload-….jpg" }` · 422 se não for JPG/PNG/WebP ou passar de 5 MB · 413 acima de 8 MB |

O upload não mexe no banco: a imagem vai pra pasta que a API serve em `/posteres` e o caminho devolvido é usado no `posterUrl` do filme. O tipo é conferido pelos primeiros bytes do arquivo, não pelo `Content-Type`, e o nome é gerado pela API.

### Salas

| Verbo | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| GET | `/salas` | 🛠 | — | 200 `[{ id, nome, ativa, capacidade, filas, sessoes }]` |
| GET | `/salas/:id` | 🛠 | — | 200 sala + `assentos: [{ id, fila, numero }]` |
| POST | `/salas` | 🛠 | `{ nome, filas (1–26), assentosPorFila (1–30) }` | 201: assentos gerados pela procedure · 409 nome em uso · 422 layout inválido |
| PUT | `/salas/:id` | 🛠 | `{ nome?, ativa? }` | 200 |
| DELETE | `/salas/:id` | 🛠 | — | 204 · 409 se tiver sessões |

### Sessões e mapa de assentos

| Verbo | Rota | Acesso | Corpo / Query | Resposta |
|---|---|---|---|---|
| GET | `/sessoes` | 🔓 | `?filmeId=&data=AAAA-MM-DD&todas=true` | 200 `Sessao[]` (próximas, por padrão) |
| GET | `/sessoes/:id` | 🔓 | — | 200 `Sessao` |
| GET | `/sessoes/:id/assentos` | 🔓 (👤 marca `minhaReserva`) | — | 200 `MapaSessao` |
| POST | `/sessoes` | 🛠 | `{ filmeId, salaId, inicio (ISO com fuso), preco }` | 201 (mapa gerado pela trigger) · 409 sobreposição · 422 no passado |
| PUT | `/sessoes/:id` | 🛠 | `{ preco }` | 200 · 409 se já houver reservas |
| DELETE | `/sessoes/:id` | 🛠 | — | 204 · 409 se já houver reservas |

```ts
Sessao = { id, inicio, fim, preco, filme: { id, titulo, duracaoMin, classificacao, genero, posterUrl }, sala: { id, nome } }
MapaSessao = {
  sessao: Sessao,
  filas: [{ fila: "A", assentos: [{ id, numero, status: "LIVRE"|"RESERVADO"|"VENDIDO", minhaReserva }] }],
  resumo: { livres, reservados, vendidos, capacidade }
}
```

### Reservas e pagamento

| Verbo | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/reservas` | 👤 | `{ sessaoId, assentoIds: number[1..10], nomeCliente? }` | 201 `Reserva` (PENDENTE) · **409 assento indisponível** · 422 sessão já começou |
| GET | `/reservas/:id` | 👤 dono ou 🛠 | — | 200 `Reserva` |
| DELETE | `/reservas/:id` | 👤 dono ou 🛠 | — | 204 (assentos liberados) |
| POST | `/reservas/:id/pagamento` | 👤 dono ou 🛠 | — (pagamento simulado) | 201 `Reserva` (PAGA, com `ingressos`) · **410 expirada** · 409 já paga |

Quando quem reserva é operador, a venda é registrada como `canal: "BALCAO"`; quando é cliente, como `"ONLINE"`.

```ts
Reserva = {
  id, status: "PENDENTE"|"PAGA"|"EXPIRADA"|"CANCELADA", canal: "ONLINE"|"BALCAO", nomeCliente,
  criadaEm, expiraEm, valorTotal, sessao: Sessao,
  assentos: [{ id, fila, numero, rotulo }],
  ingressos: [{ codigo, status, valor, assento }]
}
```

### Ingressos

| Verbo | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| GET | `/ingressos/meus` | 👤 | — | 200 `Ingresso[]` |
| GET | `/ingressos/:codigo` | 👤 dono ou 🛠 | — | 200 `Ingresso` |
| POST | `/ingressos/validacao` | 🛠 | `{ codigo }` | 200 (UTILIZADO) · 404 · **409 já utilizado** (`detalhes.utilizadoEm`) · 422 fora do horário |
| POST | `/ingressos/cancelamento` | 👤 dono ou 🛠 | `{ codigos: string[] }` (1 a 100, mesma sessão) | 200 `Ingresso[]` (CANCELADO) · 403 de outra pessoa · 404 algum código não existe · 409 já usado ou cancelado · 422 fora do prazo |

`Ingresso = { codigo, status, valor, fila, numero, assento, emitidoEm, utilizadoEm, nomeCliente, sessao: Sessao }`

### Relatórios (Gerência)

| Verbo | Rota | Acesso | Query | Resposta |
|---|---|---|---|---|
| GET | `/relatorios/ocupacao` | 🛠 | `inicio`, `fim` (ISO), `filmeId?` | `{ periodo, sessoes: [{ sessaoId, filme, sala, inicio, preco, capacidade, vendidos, utilizados, taxaOcupacao, receita }], totais }` |
| GET | `/relatorios/vendas` | 🛠 | `inicio`, `fim` (ISO) | `{ periodo, receitaTotal, ingressosVendidos, porCanal: [{ canal, reservas, valor }], porFilme: [...] }` |

### Infraestrutura

| Verbo | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/saude` | 🔓 | 200 `{ status: "ok", banco: true }` · 503 se o banco estiver fora |
