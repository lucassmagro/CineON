# CineON — Contexto do projeto para o Claude

> Carregado automaticamente em toda sessão do Claude Code neste repositório.
> Mantenha este arquivo **atualizado** quando decisões forem tomadas ou fases concluídas.

## O que é

Trabalho Final de **Programação II + Banco de Dados II**, UNOESC Chapecó, 2026/2. Professor: Álvaro G. Pagliari.
**CineON** é um app de bilheteria de cinema com marcação de assentos.

- Equipe: Alexandre Reitemeyer, Lucas Santos Magro (usuário principal), Beatriz Miranda, Gabriel Nassinger
- Enunciado: `Trabalho Final 2026-2.pdf` (raiz, fora do Git)
- Plano aprovado: [PLANO_DE_IMPLEMENTACAO.md](../PLANO_DE_IMPLEMENTACAO.md) (seção 0 tem as decisões aprovadas)
- Visão geral para humanos: [README.md](../README.md) · documentação de entrega em `docs/`
- Material das aulas: `artefatos/` (fora do Git). Projetos de referência do professor: `artefatos/receitas.zip` (melhor exemplo)
- **Apresentação: 24/11/2026, presencial, EM PRODUÇÃO** (se não estiver em produção, perde pontos)

## Decisões aprovadas (09/11/2026)

- D1 monorepo (`backend/` + `mobile/`) · D2 cinema · D3 AWS EC2 + RDS + nginx + systemd + certbot
- **D4: só o que o PDF pede.** SEM meia-entrada, SEM QR Code, SEM câmera, SEM método de pagamento. O pagamento é um botão "Pagar" simulado
- D5 reserva expira em 10 min (`RESERVA_MINUTOS`). O PDF não define tempo
- **Visual do app: extremamente simples, inspirado no iOS da Apple** (fundo `#F2F2F7`, grupos brancos, azul `#007AFF`, título grande). Será lapidado depois

## Status (atualizado em 10/11/2026)

- [x] F0/F1 Setup + banco: schema, migrações `init` e `objetos_sql`, seed
- [x] F2 Backend completo + 14 testes passando (unidade, integração, concorrência)
- [x] F4 App Expo: Cliente + Bilheteria + Gerência. Typecheck e lint limpos. Fluxos testados no Chrome headless
- [x] Docs: DER, casos de uso, API, regras, concorrência, deploy; arquivos em `deploy/`
- [ ] **F3 Deploy na AWS: depende da conta AWS e de um domínio da equipe** (guia em `docs/deploy.md`)
- [x] Código e docs no GitHub (`main`, 14 commits convencionais, push em 09/11)
- [ ] Lapidação visual (pendências: rótulos das abas levemente cortados na Web em modo celular; `headerBackVisible` ignorado na Web)
- [ ] Preencher as URLs de produção no README; gerar o PNG do DER/casos de uso se o professor exigir imagem

## Ambiente de desenvolvimento (atenção!)

- Windows 11. Bash = Git Bash. Use a ferramenta Write para arquivos grandes (heredoc com aspas quebra).
- **Existe um PostgreSQL 18 nativo do Windows em `localhost:5432` (senha `postgres`)**. Ele NÃO é o banco do projeto. O container do projeto (`backend/docker-compose.yml`) roda na porta **5433**, com `DATABASE_URL=...@127.0.0.1:5433/cineon`. Um banco `cineon` foi criado por engano no PG18 nativo em 09/11: pode ser apagado, se o usuário quiser.
- Docker Desktop precisa estar aberto: `cd backend && docker compose up -d`.
- O Prisma bloqueia `migrate reset` vindo de IA sem consentimento explícito do usuário. Use `migrate dev --create-only` **uma única vez** (rodar duas vezes aplica a migração vazia).
- Testes: `cd backend && npm test` (precisa do seed). App: `cd mobile && npx tsc --noEmit && npx expo lint`.
- `pdftotext -enc UTF-8` para ler os PDFs das aulas.

## Arquitetura implementada

**Backend** (`backend/src`): `routes/` → `controllers/` (Zod + DTO) → `services/` (regras, sem Prisma nem Express) → `repositories/` (único lugar com Prisma).

- `repositories/contratos.ts`: interfaces + `UnidadeDeTrabalho` (o `$transaction` interativo entrega repositórios ligados ao `tx`)
- `domain/`: tipos, erros de domínio por categoria (o middleware traduz para HTTP), `valores.ts` (código do ingresso, dinheiro em centavos, fuso -03:00)
- `services/regrasAssento.ts`: regra central de disponibilidade (RESERVADO sem dados da reserva = indisponível, à prova de falha)
- `container.ts`: injeção de dependências manual (o relógio é injetável, e os testes avançam o tempo)
- `jobs/expirarReservas.ts`: `setInterval` de 30 s → `ReservaService.expirarVencidas` (`FOR UPDATE SKIP LOCKED`)

**Concorrência (crítico):** `MapaAssentosPrismaRepository.travar` faz o `FOR UPDATE` (`ORDER BY assento_id`) e a leitura em **DOIS comandos**. Em READ COMMITTED, um JOIN no mesmo comando do lock lê as outras tabelas com o snapshot antigo. Esse bug foi pego pelo teste dos 20 cliques e corrigido. Explicação em `docs/concorrencia.md`.

**Banco** (migração `objetos_sql`): `btree_gist`, CHECKs, `EXCLUDE` (sessões sobrepostas), índice parcial `ix_reservas_pendentes_expira_em`, trigger `trg_sessao_gera_mapa`, triggers de auditoria → `log_auditoria`, procedure `sp_gerar_assentos_sala`, função `fn_relatorio_ocupacao` (5 tabelas, CTEs). Testado: o Prisma **não** acusa drift com esses objetos.

**App** (`mobile/src`): MVVM. `app/` (rotas Expo Router: `(cliente)/(abas)` e `(operador)/(painel)` com guard por papel), `telas/` (TelaMapaSessao e TelaReserva, compartilhadas por cliente e balcão), `hooks/` (ViewModels: `useCarregar`, `useMapaAssentos` com polling de 5 s, `useContagem`/`useAgora`), `services/` (api + cineon), `ui/` (tema iOS + componentes), `utils/` (formatação no fuso do cinema e diálogos que também funcionam na Web). O React Compiler está ativo: não chamar `Date.now()` no render; usar `useAgora`.

## Convenções do professor (seguir)

- Backend: express@5, prisma@7 + adapter-pg, zod@4, jsonwebtoken, bcryptjs, TS strict + `noUncheckedIndexedAccess`, ESM com `.js` nos imports, `node:test` via `tsx --test`
- Frontend: Expo SDK 57, expo-router, `expo-secure-store` para o token (memória na Web), `EXPO_PUBLIC_API_URL` sem segredos, `npx expo install` para adicionar pacotes
- Domínio em português. Pastas de camada com os nomes da rubrica

## Acordos de trabalho

- Comunicação **em português**. O usuário aprova planos em `.md` antes de implementar mudanças grandes.
- **Não commitar nem dar push sem o usuário pedir.**
- Commits seguem **Conventional Commits** em português: `tipo(escopo): descrição` com tipos `feat`, `fix`, `docs`, `test`, `chore`, `refactor` e escopos `api`, `db`, `mobile`, `deploy`. Um commit por assunto.
- **Comentários no código precisam parecer escritos pela equipe, não por IA.** Nada de banners (`// ====`, `// ----`, `-- ====`), setas `->`/`→`, travessão `—`, MAIÚSCULAS de ênfase ou "(Aula X de P2)". Comentários curtos, em português informal de dev ("pra", "aqui"), só quando explicam um porquê.
- Se editar uma migração já aplicada (mesmo só comentário), atualize o checksum em `_prisma_migrations` do banco local (sha256 do arquivo) ou o Prisma vai pedir reset.
- Usuários da seed (senha `cineon123`): `operador@cineon.com`, `ana@cineon.com`, `bruno@cineon.com`.
