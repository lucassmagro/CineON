# CineON — Regras de negócio

Todas as regras estão implementadas **na camada service** do backend ([backend/src/services](../backend/src/services)). O banco tem constraints que funcionam como **última barreira**: se a regra do service falhar, o banco recusa o dado.

| RN | Regra | Onde (service) | Barreira no banco |
|---|---|---|---|
| RN01 | Um assento de uma sessão só pode ser vendido a um cliente | `ReservaService.reservar`, `PagamentoService.pagar`, `regrasAssento.estaDisponivel` | PK `assentos_sessao(sessao_id, assento_id)` + índice único parcial `ux_ingressos_assento_ativo` em `ingressos(sessao_id, assento_id) WHERE status <> 'CANCELADO'` |
| RN02 | A reserva expira em `RESERVA_MINUTOS` (padrão 10). Depois disso os assentos voltam a ficar livres | `regrasAssento.estaDisponivel` (sob demanda) + `ReservaService.expirarVencidas` (job a cada 30 s) | `CHECK expira_em > criada_em` |
| RN03 | Só se reserva assento LIVRE ou RESERVADO com reserva vencida/encerrada | `ReservaService.reservar` | — |
| RN04 | Só se paga reserva PENDENTE e dentro do prazo. O cliente paga só a própria reserva; o operador paga qualquer uma (balcão) | `PagamentoService.pagar` | `UNIQUE pagamentos(reserva_id)` |
| RN05 | O pagamento emite 1 ingresso por assento, com código único de 10 caracteres (sem caracteres ambíguos) | `PagamentoService.pagar`, `gerarCodigoIngresso` | `UNIQUE ingressos(codigo)` |
| RN06 | Validação na entrada: o ingresso deve existir e estar VALIDO, em qualquer horário. Marca UTILIZADO com data/hora e operador | `IngressoService.validar` | `CHECK` UTILIZADO ⇒ `utilizado_em` preenchido |
| RN07 | Sessão: só no futuro, preço ≥ 0, `fim = início + duração + limpeza (15 min)`, sem sobrepor outra sessão da mesma sala | `SessaoService.criar` | `EXCLUDE` (sala, intervalo), `CHECK preco >= 0`, `CHECK fim > inicio` |
| RN08 | Não se reserva sessão que já começou | `ReservaService.reservar` | — |
| RN09 | Máximo de 10 assentos por reserva | `ReservaService.reservar` (+ Zod no controller) | — |
| RN10 | O cliente só vê os próprios ingressos e reservas. Bilheteria e Gerência são exclusivas de OPERADOR | `garantirDonoOuOperador`, middleware `exigirOperador` | — |
| RN11 | O valor é sempre calculado no servidor (preço da sessão × assentos), em centavos | `ReservaService`, `PagamentoService` | `CHECK valor >= 0` |
| RN12 | Filme, sala ou sessão com vínculos não é excluído (filme e sala são desativados) | `FilmeService.remover`, `SalaService.remover`, `SessaoService.remover` | FKs `ON DELETE RESTRICT` |
| RN13 | O layout da sala é fixo depois que ela recebe sessões | `SalaService` | procedure recusa gerar assentos de sala com sessões |
| RN14 | Uma nova reserva online do mesmo cliente na mesma sessão substitui a reserva pendente anterior | `ReservaService.reservar` | — |
| RN15 | O cadastro público cria só CLIENTE. Operadores são criados por outro operador | `AuthService.cadastrarCliente` / `criarOperador` | enum `Papel` |
| RN16 | Cancelamento: o dono (ou um operador) cancela ingressos VALIDO de uma mesma sessão até `CANCELAMENTO_ANTECEDENCIA_MIN` (padrão 30) antes do início. Tudo ou nada: o ingresso vira CANCELADO, o assento volta a LIVRE e o valor sai do `valor_total` da reserva (estorno simulado), então o relatório de vendas mostra a receita líquida | `IngressoService.cancelar` | índice parcial deixa revender o assento; o cancelado fica no histórico e no `log_auditoria` |

## Erros de domínio → HTTP

Os services lançam erros de domínio, que não conhecem HTTP. O middleware `tratarErros` traduz a categoria de cada erro em status:

| Categoria | Status | Exemplos |
|---|---|---|
| `NAO_ENCONTRADO` | 404 | sessão, reserva ou ingresso inexistente |
| `NAO_AUTENTICADO` | 401 | e-mail ou senha inválidos |
| `PROIBIDO` | 403 | cliente tentando acessar a gerência ou a reserva de outra pessoa |
| `CONFLITO` | 409 | **assento indisponível**, sessão sobreposta, ingresso já utilizado, reserva já paga |
| `EXPIRADO` | 410 | prazo da reserva vencido |
| `REGRA_VIOLADA` | 422 | sessão no passado, sessão já começou, layout inválido, fora do horário de entrada |
| (Zod) | 400 | formato inválido da entrada |
