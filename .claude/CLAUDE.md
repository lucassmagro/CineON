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
- **D4: só o que o PDF pede.** SEM meia-entrada, SEM QR Code, SEM câmera, SEM método de pagamento. O pagamento é um botão "Pagar" simulado. Exceções pedidas pelo usuário depois: cancelamento de ingresso e pôsteres (10/11)
- D5 reserva expira em 10 min (`RESERVA_MINUTOS`). O PDF não define tempo
- **Visual do app (redesenho de 10/11): minimalista no estilo Apple, SEM gradientes.**
  - Cores do sistema iOS em `src/ui/tema.ts`, modo claro/escuro automático (`useTema`), escala tipográfica do iOS (`tipos`).
  - Uma só cor de ação: o azul do sistema (botões, assentos escolhidos, seleção). O dia escolhido é preto/branco, como no Calendário.
  - Cada filme tem um tom sólido de uma paleta curada de 8 cores (`src/ui/arteFilme.ts`, escolhido pelo id). Ele aparece no ingresso (`Passe`, um por sessão, estilo Wallet) e como reserva da capa quando o filme não tem pôster.
  - **Upload de pôster** (24/11, pedido do usuário, sem mudar o banco): no formulário do filme, "Escolher imagem" usa o `expo-image-picker` (seletor de arquivos na Web, galeria no celular) e manda os bytes crus pra `POST /filmes/poster` (`api.enviarArquivo`). A API (`express.raw` só nessa rota, `PosterService` confere tipo pelos primeiros bytes e o limite de 5 MB, `PosterDiscoRepository` grava em `PASTA_POSTERES` com nome `upload-*` gerado) devolve `/posteres/upload-….jpg`, que vai no `posterUrl` de sempre. Os uploads ficam fora do Git. Em produção o nginx precisa de `client_max_body_size 8m` (no servidor está em `/etc/nginx/conf.d/cineon-upload.conf`).
  - **Faixas que rolam de lado com setas** (24/11): `ui/RolagemComSetas.tsx` (seta só aparece quando há mais conteúdo naquele lado; rola 80% da largura). Usada nos cartazes do formulário de sessão (`centroSetas` no meio do pôster) e no `SeletorDia`. Ao testar com Puppeteer, print com `clip` precisa de `captureBeyondViewport: false`, senão a página muda de tamanho durante a captura e a seta aparece de mentira.
  - **Pôsteres** (10/11): coluna `filmes.poster_url` (migração `poster_filme`), opcional, com caminho `/posteres/x.jpg` ou URL http(s). A API serve `backend/public/posteres/` em `/posteres` (cache de 7 dias). São montagens da equipe sobre fotos do Pexels (créditos em `CREDITOS.md` na mesma pasta). `Arte` esmaece a imagem por cima do bloco de cor; `urlArquivo()` em `services/api.ts` resolve o caminho relativo. A miniatura (`mini`) é em pé, 40×60. O formulário de filme tem o campo "Pôster".
  - Margem responsiva `useMargem()` (16 no celular, 20 em telas ≥ 600) e largura máxima: `larguraLeitura` 680 para listas e formulários, `larguraGrade` 1080 para a grade de filmes. A grade de Em cartaz tem 3 colunas de pôsteres grandes a partir de 600 px e 2 no celular, com o título e o gênero em texto embaixo de cada pôster.
  - Gerência no estilo Ajustes (`Linha` com `icone`), contadores −/+ (`Contador`) e formulários em modal.
  - **Cadastros fáceis de achar** (24/11, pedido do usuário, que achava difícil encontrar onde criar): a Gerência abre com a seção "Cadastrar" (cartões `CartaoCriar` de Novo filme, Nova sala e Nova sessão; no celular deitados com um "+" azul, a partir de 600 px lado a lado com "+ Criar") e depois "Consultar e editar" com a contagem de cada lista. As listas têm um `Botao` "Cadastrar novo…" no topo e nada no canto do cabeçalho (o "+ Novo" de lá ficava redundante e saiu, junto com o `BotaoCabecalho`). Nos formulários o botão de criar/salvar fica no `rodape` da `Tela` (fixo embaixo, com o `TextoErro` em cima).
  - **Tema claro/escuro manual**: `TemaProvider` (`contexts/TemaContext.tsx`) guarda "sistema/claro/escuro" no AsyncStorage (`storage/preferenciasStorage.ts`). O `BotaoTema` fica ao lado do título das abas, no login e no cadastro. A troca é um esmaecimento cruzado calmo de 460 ms (na Web com View Transitions em `utils/transicaoTema.web.ts`, no celular um véu). A revelação circular foi descartada em 10/11 por destoar do resto. A Conta (`components/TelaConta.tsx`) tem cartão de perfil, resumo dos ingressos e próxima sessão (cliente), atalhos (operador) e o segmentado "Aparência" (o usuário preferiu o segmentado às miniaturas de tela).
  - **Movimento**: todo toque passa pelo `Tocavel` (`ui/Tocavel.tsx`, Reanimated): mola ao apertar, crescimento leve no hover da Web, `realce` para linhas de lista e vibração no celular. `ui/animacoes.tsx` tem `Surgir` (entrada escalonada), `AparecerTela`, `Pulso` (pulo quando um valor muda), `Expandir` (abre e fecha animando a altura real), `Chegar` (entrada com mola, usada na compra confirmada) e `EmSequencia` (códigos do passe em cascata). **Não usar o `entering`/`layout` do Reanimated**: na Web ele põe `position: absolute` no item uns 2 s depois da entrada e tudo se sobrepõe; e o `LinearTransition` da Web anima tamanho com `scale` (texto distorce). **Props do `Tocavel` não podem mudar entre renders** (papel, escala): na Web isso recria o elemento e corta a animação. O `Segmentos` tem pílula deslizando. Tudo respeita o "reduzir movimento".
  - **Navegação**: `ui/Pilha.tsx` usa a pilha nativa no celular e a pilha JS na Web, com deslize e esmaecimento. Na Web a pilha JS vem SEM animação por padrão (`animation: 'default'` liga) e o `Stack.Screen` dela é outro componente (`Pilha.Screen` resolve). As abas usam a `BarraAbas`: uma pílula flutuante centralizada (`tabBar={barraAbas}`), com destaque deslizando.
  - Favicon: bloco preto arredondado com o ícone de filme em branco.
  - **Avisos e confirmações** (10/11): `utils/dialogos` (`notificar(tipo, titulo, msg)` e `confirmar(...)`). Na Web viram toasts do `react-toastify` v11 (`dialogos.web.ts` reexporta `dialogosWeb.tsx`; o contêiner `ui/Toasts.web.tsx` fica no `_layout` raiz e usa as cores do tema, com a confirmação em toast de dois botões). No celular continua o `Alert.alert` nativo (sucesso não mostra nada, já tem vibração). Não usar `window.alert`/`confirm` nem `Alert.alert` direto nas telas. **Metro: um arquivo `.web.tsx` NÃO substitui um `.ts` de mesmo nome, a extensão tem que ser igual** (por isso `dialogos.web.ts` + `dialogosWeb.tsx`; `Toasts.tsx`/`Toasts.web.tsx` e `transicaoTema.ts`/`.web.ts` funcionam porque as extensões casam). O `Alert.alert` no react-native-web não faz nada e não dá erro, então esse engano é silencioso.
  - **Sessão**: `storage/tokenStorage.ts` guarda o token no SecureStore (celular) ou no `localStorage` (Web). Ao abrir, o `AuthProvider` confere com `/auth/me`: token vencido ou inválido encerra a sessão e apaga o token; sem rede (status 0) mantém o token pra tentar de novo. O logout apaga o token.
  - **Boas-vindas após o login** (`components/BoasVindas.tsx`, montado no `_layout` raiz): o `entrar` do `AuthContext` grava `boasVindas` (primeiro nome, papel, hora). Fundo sólido cobre o login, o ícone surge com mola, dois anéis finos se abrem (o projetor acendendo), entra "Bom dia/Boa tarde/Boa noite, Nome." e "Bom filme." ou "Bom trabalho."; depois tudo cresce de leve e some revelando o app, ~2,1 s. Um toque pula; com reduzir movimento é só um esmaecimento. Recarregar com token salvo não mostra.
  - **Página do filme na cor do pôster** (21/11, pedido do usuário; exceção à "uma só cor de ação" só nessa página): abertura em largura total com o fundo escuro do pôster (cabeçalho e seta na mesma cor, via `navigation.setOptions`), pôster grande com sombra, gênero na cor de destaque, título grande, ficha (duração, classificação, próxima sessão) e sinopse. Seções com traço na cor de destaque; o dia escolhido usa o destaque (`SeletorDia` ganhou `corAtiva`/`corTextoAtivo`). Paletas em `ui/coresPoster.ts`: extraídas dos pixels dos 6 pôsteres e ajustadas no olho; filme sem pôster conhecido gera a paleta a partir do tom de `arteFilme`. Tudo em cor sólida, sem gradiente. No desktop o trailer ocupa a largura da abertura (980).
  - **Rolagem na Web**: a `Pilha` soma `flex: 1` ao `cardStyle` (o card da pilha JS usava só `minHeight: 100%` e as telas da pilha não rolavam). Os layouts `(cliente)` e `(operador)` têm `unstable_settings.initialRouteName` pra seta de voltar aparecer mesmo recarregando a página.
  - **Trailers** (21/11 e 22/11, exceção ao D4 pedida pelo usuário): seção "Trailer" na página do filme. Teaser de 30 s feito em código (sem arquivo de vídeo). `components/Trailer.tsx` é só o player: um relógio (`t` em ms, `withTiming` linear), capa, pausa (`cancelAnimation(t)`), barra de progresso na cor do pôster, "Ver de novo"; a página manda tocar pelo `controle` (ref com `tocarDoComeco`, não usar efeito com setState). **Cada filme tem um estilo diferente** em `components/trailer/`: `Corrida` (Velozes: 3-2-1, riscos de velocidade, palavras batendo, relógio até 17:59, barra de build), `Oceano` (Bug: água subindo, bolhas, logs, peixinho), `Diario` (Forrest: `git log` digitado, grafo de commits, serifa), `Silencio` (Servidores: glitch no 03:00, rack de LEDs apagando, ping em timeout, susto), `Conversa` (Chatbot: chat com "digitando…", rosto do robô), `Tempo` (Backup: relógio girando pra trás, odômetro 2026→1985, salto de luz) e `Classico` (reserva). `base.tsx` tem as peças: `Cena` (janela de tempo), `Fundo`, `Surge` (sobe/bate/pisca/quica/lento), `Palavras`, `Digitado`, `Odometro` (dígito só gira no fim da volta), `Fecho`. Roteiros em `ui/roteirosTrailer.ts` (estilo, 4 frases, tagline, extras); filme novo ganha estilo pelo gênero e frases da sinopse. **Pôster em tela cheia com texto por cima precisa de desfoque**, senão o letreiro do cartaz aparece cortado atrás. Pausa ao sair da tela (`useFocusEffect`); com reduzir movimento, sem zoom nem deslize.
  - A página do filme também tem o pôster desfocado por baixo da abertura (camada sólida na cor do filme por cima), a tagline em serifa e os botões "Assistir ao trailer" (rola e toca) e "Ver sessões" (a `Tela` ganhou `refRolagem`).
  - A tela de Conta não repete o botão de tema (`semBotaoTema` no `Tela`): a escolha de aparência já está nela.
- **Filmes com nomes de paródia do mundo da tecnologia** (seed e banco local): Velozes e Compilados, Procurando o Bug, Forrest Commit, O Silêncio dos Servidores, O Poderoso Chatbot, De Volta para o Backup
- Na Web o Metro deste ambiente **não recarrega** arquivos alterados: reinicie com `npx expo start --web --clear` para ver mudanças. O Expo reescreve o `mobile/tsconfig.json` ao iniciar (`git checkout` nele)

## Status (atualizado em 10/11/2026)

- [x] F0/F1 Setup + banco: schema, migrações `init`, `objetos_sql`, `poster_filme` e `cancelamento_ingresso`, seed
- [x] F2 Backend completo + 17 testes passando (unidade, integração, concorrência). Corrigido em 10/11: o `AlteracaoFilme` herdava o default da sinopse e um PUT só com `ativo` apagava a sinopse
- [x] F4 App Expo: Cliente + Bilheteria + Gerência. Typecheck e lint limpos. Fluxos testados no Chrome headless
- [x] Docs: DER, casos de uso, API, regras, concorrência, deploy; arquivos em `deploy/`
- [x] **F3 Deploy na AWS: no ar em `https://cineon.agp.app.br`** (app na raiz e API em `/api`) **e `https://api.cineon.agp.app.br`** (API na raiz). Em 23/11 o professor criou os registros A dos dois nomes pro IP `18.226.44.216`; certificado Let's Encrypt único pros dois (certbot `--nginx --redirect`, sem e-mail, vence em 21/02/2027, renovação pelo `snap.certbot.renew.timer`). O `http://` redireciona pro `https://`; pelo IP segue em HTTP, de plano B. `CORS_ORIGENS=https://cineon.agp.app.br,http://18.226.44.216`. Backup da config do nginx de antes do HTTPS em `~/nginx-cineon.antes-https.bak` na EC2. Conta no Plano Gratuito (créditos, sem cobrança), região **Ohio `us-east-2`**, EC2 `cineon-api` t3.micro + RDS `cineon-db` db.t4g.micro (banco `cineon`, privado, SSL com `NODE_EXTRA_CA_CERTS`). App e API no mesmo endereço: nginx serve o app na raiz e a API em `/api`; o build Web usa `EXPO_PUBLIC_API_URL=/api` (gerar pelo PowerShell com `--clear`, o Git Bash estraga o `/api`). Chave SSH: `cineon.pem` na raiz (ignorada no Git). A senha dos usuários da seed em produção NÃO é `cineon123` (`SEED_SENHA`, só a equipe sabe). Atualizar o servidor: `bash deploy/atualizar.sh` na EC2 (só a API; o app Web é o build do `mobile/dist` copiado por cima de `/var/www/cineon` com `sudo cp -r ~/pasta/. /var/www/cineon/`, sem `rm -rf` no servidor, que o modo automático bloqueia). Cópia do app de antes da gerência nova em `~/web-antes-gerencia` na EC2
- [x] Código e docs no GitHub (`main`, commits convencionais, último push em 10/11)
- [x] Lapidação visual: pôsteres, tema manual, animações, pílula das abas (o problema dos rótulos cortados sumiu com a barra nova)
- [x] URLs de produção (domínio com HTTPS) no README, nos docs e na apresentação (23/11)
- [x] Diagrama de casos de uso em `docs/casos-de-uso.svg` e `.png` (23/11), desenhado à mão a partir do `.puml`
- Validação do ingresso (RN06) sem restrição de horário desde 23/11: entra a qualquer hora, só precisa estar VALIDO

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

**Cancelamento de ingresso (10/11, RN16/UC18):** `POST /ingressos/cancelamento { codigos }` em `IngressoService.cancelar`. Dono ou operador, só VALIDO, mesma sessão, até `CANCELAMENTO_ANTECEDENCIA_MIN` (30) antes do início, tudo ou nada. Locks: ingressos `ORDER BY id` e depois assentos. Ingresso vira CANCELADO, assento LIVRE e o valor sai do `valor_total` da reserva (estorno simulado). O `@@unique(sessaoId, assentoId)` virou o índice único parcial `ux_ingressos_assento_ativo ... WHERE status <> 'CANCELADO'` (SQL na migração `cancelamento_ingresso`; o Prisma não acusa drift, conferido com `migrate diff`). No app: botão "Cancelar ingressos" embaixo do passe aberto e a tela modal `(cliente)/cancelar/[sessaoId]` (começa sem nada marcado, "Todos os lugares", estorno no rodapé). `CANCELAMENTO_MINUTOS` em `services/cineon.ts` precisa bater com a API.

**Banco** (migração `objetos_sql`): `btree_gist`, CHECKs, `EXCLUDE` (sessões sobrepostas), índice parcial `ix_reservas_pendentes_expira_em`, trigger `trg_sessao_gera_mapa`, triggers de auditoria → `log_auditoria`, procedure `sp_gerar_assentos_sala`, função `fn_relatorio_ocupacao` (5 tabelas, CTEs). Testado: o Prisma **não** acusa drift com esses objetos.

**App** (`mobile/src`): MVVM. `app/` (rotas Expo Router: `(cliente)/(abas)` e `(operador)/(painel)` com guard por papel), `telas/` (TelaMapaSessao e TelaReserva, compartilhadas por cliente e balcão), `hooks/` (ViewModels: `useCarregar`, `useMapaAssentos` com polling de 5 s, `useContagem`/`useAgora`), `services/` (api + cineon), `ui/` (tema iOS + componentes), `utils/` (formatação no fuso do cinema e diálogos que também funcionam na Web). O React Compiler está ativo: não chamar `Date.now()` no render; usar `useAgora`.

## Convenções do professor (seguir)

- Backend: express@5, prisma@7 + adapter-pg, zod@4, jsonwebtoken, bcryptjs, TS strict + `noUncheckedIndexedAccess`, ESM com `.js` nos imports, `node:test` via `tsx --test`
- Frontend: Expo SDK 57, expo-router, `expo-secure-store` para o token (na Web vai pro `localStorage`, de propósito, pra não deslogar ao recarregar; escolha do usuário em 10/11, o professor usa memória), `EXPO_PUBLIC_API_URL` sem segredos, `npx expo install` para adicionar pacotes
- Domínio em português. Pastas de camada com os nomes da rubrica

## Acordos de trabalho

- Comunicação **em português**. O usuário aprova planos em `.md` antes de implementar mudanças grandes.
- **Não commitar nem dar push sem o usuário pedir.**
- Commits seguem **Conventional Commits** em português: `tipo(escopo): descrição` com tipos `feat`, `fix`, `docs`, `test`, `chore`, `refactor` e escopos `api`, `db`, `mobile`, `deploy`. Um commit por assunto.
- **Comentários no código precisam parecer escritos pela equipe, não por IA.** Nada de banners (`// ====`, `// ----`, `-- ====`), setas `->`/`→`, travessão `—`, MAIÚSCULAS de ênfase ou "(Aula X de P2)". Comentários curtos, em português informal de dev ("pra", "aqui"), só quando explicam um porquê.
- Se editar uma migração já aplicada (mesmo só comentário), atualize o checksum em `_prisma_migrations` do banco local (sha256 do arquivo) ou o Prisma vai pedir reset.
- Usuários da seed (senha `cineon123`): `operador@cineon.com`, `ana@cineon.com`, `bruno@cineon.com`.
