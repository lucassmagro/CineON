# CineON

Aplicativo de **bilheteria de cinema com marcação de assentos**. Trabalho Final de Programação II + Banco de Dados II, UNOESC Chapecó, 2026/2.

**Equipe:** Alexandre Reitemeyer · Beatriz Miranda · Gabriel Nassinger · Lucas Santos Magro

| | |
|---|---|
| API em produção | _(preencher após o deploy)_ |
| App Web | _(preencher após o deploy)_ |

## O que o sistema faz

- **Cliente**: vê os filmes em cartaz e as sessões, escolhe os assentos no **mapa** (livre / reservado / vendido), tem alguns minutos para pagar (reserva temporária com expiração), paga (simulado) e recebe os **ingressos com código único**.
- **Bilheteria (operador)**: vende no balcão e **valida os ingressos na entrada**, marcando-os como utilizados.
- **Gerência (operador)**: cadastra filmes, salas (os assentos são gerados automaticamente) e sessões, e consulta o **relatório de vendas e ocupação**.
- **Garantia central**: um assento de uma sessão **nunca** é vendido duas vezes, nem com cliques simultâneos. Detalhes em [docs/concorrencia.md](docs/concorrencia.md).

## Estrutura

```
backend/   API REST — TypeScript, Node.js, Express 5, Prisma 7, PostgreSQL
           src/routes → src/controllers → src/services (regras) → src/repositories (Prisma)
mobile/    App — Expo SDK 57 / React Native + TypeScript (Android, iOS e Web), MVVM
docs/      DER, casos de uso, definição da API, regras de negócio, concorrência, deploy
deploy/    systemd, nginx, script de atualização e permissões do banco (AWS EC2 + RDS)
```

## Documentação (modelagem pedida no trabalho)

- [Diagrama Entidade-Relacionamento](docs/der.md)
- [Diagrama de Casos de Uso](docs/casos-de-uso.md) ([.puml](docs/casos-de-uso.puml))
- [Definição da API](docs/api.md) e [requisições prontas](backend/requisicoes.http)
- [Regras de negócio](docs/regras-de-negocio.md)
- [Transações e concorrência](docs/concorrencia.md)
- [Deploy na AWS](docs/deploy.md)

## Como rodar localmente

Pré-requisitos: Node.js 22+, Docker.

```bash
# 1. Banco + API
cd backend
docker compose up -d            # PostgreSQL 16 na porta 5433
cp .env.example .env            # e defina um JWT_SECRET
npm install
npx prisma migrate dev          # tabelas + trigger, procedure, função, constraints
npm run seed                    # filmes, salas, sessões e vendas de demonstração
npm run dev                     # http://localhost:3000

# 2. App (outro terminal)
cd mobile
cp .env.example .env            # EXPO_PUBLIC_API_URL=http://localhost:3000
npm install
npx expo start                  # "w" abre no navegador; ou o QR code no Expo Go
```

> No celular com Expo Go, use o IP do computador na rede (ex.: `http://192.168.0.10:3000`) em `EXPO_PUBLIC_API_URL`.

**Usuários de teste** (senha `cineon123`): `operador@cineon.com` (bilheteria + gerência), `ana@cineon.com` e `bruno@cineon.com` (clientes).

## Testes

```bash
cd backend
npm test                        # unidade + integração + concorrência (precisa do seed)
npm run typecheck
npm run demo:concorrencia -- http://localhost:3000 20   # 20 pessoas disputando o mesmo assento

cd ../mobile
npm run typecheck && npx expo lint
```

## Onde está cada critério de avaliação

| Critério | Onde |
|---|---|
| Camada repository (Prisma) | [backend/src/repositories](backend/src/repositories): único lugar que usa o Prisma Client |
| Camada service (regras) | [backend/src/services](backend/src/services): RN01–RN15 ([lista](docs/regras-de-negocio.md)) |
| Interface gráfica | [mobile/src/app](mobile/src/app): formulários sem IDs nem totais, telas por papel |
| Arquitetura | dois programas, API JSON, controller → service → repository |
| Modelagem (chaves e constraints) | [schema.prisma](backend/prisma/schema.prisma), [DER](docs/der.md) |
| Migrações (Prisma Migrate) | [backend/prisma/migrations](backend/prisma/migrations) |
| SQL: trigger, procedure, índices | [migração objetos_sql](backend/prisma/migrations/20261110002104_objetos_sql/migration.sql) |
| Transações e concorrência | [docs/concorrencia.md](docs/concorrencia.md), [testes](backend/tests/concorrencia.test.ts) |
| Relatório com 3+ tabelas | `fn_relatorio_ocupacao` (5 tabelas) → `GET /relatorios/ocupacao` |
| ORM | relações 1:1, 1:N e N:N, FK composta, `include`/`select` tipados, `groupBy`, `$transaction` |
