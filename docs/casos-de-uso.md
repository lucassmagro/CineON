# CineON — Casos de Uso

O diagrama está em [casos-de-uso.puml](casos-de-uso.puml) (PlantUML). Para gerar a imagem, use a extensão PlantUML do VS Code ou https://www.plantuml.com/plantuml.

## Atores

| Ator | Quem é |
|---|---|
| Visitante | qualquer pessoa sem login |
| Cliente | usuário com papel `CLIENTE` (cadastro público) |
| Operador – Bilheteria | usuário com papel `OPERADOR` no balcão e na entrada da sala |
| Operador – Gerência | o mesmo papel `OPERADOR`, nas telas de gerência (o PDF permite perfis só "cliente" e "operador") |
| Sistema | o relógio do servidor (job de expiração) |

## Casos de uso

| UC | Nome | Ator | Fluxo principal | Regras |
|---|---|---|---|---|
| UC01 | Cadastrar-se | Visitante | informa nome, e-mail e senha → conta CLIENTE criada | RN15 |
| UC02 | Fazer login | Visitante | e-mail + senha → token JWT; o app abre a área do papel | — |
| UC03 | Ver filmes e sessões | Visitante | lista filmes em cartaz → detalhe com sessões por dia | — |
| UC04 | Ver mapa de assentos | Visitante | mapa com livre / reservado / vendido, atualizado a cada 5 s | RN02 |
| UC05 | Reservar assentos | Cliente | escolhe até 10 assentos livres → reserva PENDENTE com prazo | RN01, RN03, RN08, RN09, RN14 |
| UC06 | Pagar reserva | Cliente | confirma o pagamento simulado dentro do prazo | RN02, RN04 |
| UC07 | Emitir ingressos | (include UC06) | 1 ingresso por assento, código único de 10 caracteres | RN05 |
| UC08 | Ver meus ingressos | Cliente | próximos (com código) e anteriores | RN10 |
| UC09 | Desistir da reserva | Cliente | libera os assentos na hora | — |
| UC18 | Cancelar ingressos | Cliente | no passe aberto, "Cancelar ingressos" → escolhe os lugares → confirma → lugares livres e valor estornado | RN16 |
| UC10 | Vender no balcão | Bilheteria | escolhe a sessão → mapa → reserva (nome do cliente opcional) → pagamento | canal BALCAO |
| UC11 | Validar ingresso | Bilheteria | digita o código → entrada liberada (UTILIZADO) ou motivo da recusa | RN06 |
| UC12 | Manter filmes | Gerência | criar, editar, desativar, excluir (sem sessões) | RN12 |
| UC13 | Manter salas | Gerência | nome + filas + assentos por fila → assentos gerados pela procedure | RN12, RN13 |
| UC14 | Manter sessões | Gerência | escolhe filme e sala, dia, horário e preço → mapa gerado pela trigger | RN07, RN12 |
| UC15 | Relatório | Gerência | período → receita, ingressos, ocupação, por canal, por filme e por sessão | — |
| UC16 | Cadastrar operador | Gerência | nome, e-mail e senha → conta OPERADOR | RN15 |
| UC17 | Expirar reservas | Sistema | a cada 30 s: reservas pendentes vencidas → EXPIRADA, assentos → LIVRE | RN02 |

As regras RN01–RN15 estão em [regras-de-negocio.md](regras-de-negocio.md).
