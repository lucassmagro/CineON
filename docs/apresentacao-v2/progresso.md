# Progresso da apresentação v2

## TL;DR

A v2 da apresentação (`docs/CineON-apresentacao-v2.pdf`, 22 slides) está com o visual padronizado e sem commit. Próximo passo: o Gabriel revisar a PDF e pedir o commit.

## Última sessão (24/11/2026)

Trabalho feito a pedido do Gabriel, em ordem:

1. Fonte dos títulos trocada de Bricolage Grotesque pra Inter Display (Inter com `opsz` 32, peso 700).
2. Tirados os separadores (linhas entre itens). As bordas dos celulares ficaram.
3. Títulos reescritos sem cara de slogan ("Um assento. Uma venda." virou "Nenhum assento vendido duas vezes" etc.), sem a segunda metade cinza e sem ponto final.
4. "CineON" saiu do rodapé de todos os slides. A capa perdeu a data e o domínio, e o subtítulo virou "Compra de ingressos com escolha do assento, no app e no balcão."
5. Textos que quebravam deixando 1 ou 2 palavras sozinhas na linha foram encurtados ou rebalanceados.
6. Os slides 5 (cor do pôster) e 6 (trailers) viraram um só, "Identidade visual": três cartões de filme na cor do pôster, com quadro do trailer, pôster, gênero, nome e tagline. Sem detalhe técnico (o Gabriel não quer "feito em código" no slide de design).
7. Celulares menos arredondados (42 px por fora, 31 por dentro).
8. Auditoria do visual (13 pontos sem regra) e depois a padronização: variáveis e componentes no topo do `<style>` e as regras escritas no `README.md` desta pasta.
9. Ajustes pedidos depois da padronização: fundos alternados (ímpar preto, par branco) e cartões em todo grupo de itens paralelos (slides 3, 11, 17 e 20).

10. Segunda rodada de revisão do Gabriel (24/11): capa com Disciplinas, Orientação e Equipe separadas por rótulo e subtítulo em cinza; rótulos viraram as partes da apresentação; slide 3 sem cartões, com ícone ao lado de cada papel; slide 5 com cartões no estilo da página do filme (pôster desfocado ao fundo, botão "Trailer"); "balcão" virou "bilheteria"; padding ótico com `text-box`; slide 12 com código e o efeito de cada regra; slide 17 com ícone e uma prova em código por cartão; slide 13 virou o diagrama pedidos, SQL e respostas; nenhum "·" no texto.

**Onde paramos:** tudo acima aplicado e conferido no Chrome (sem sobreposição nem texto passando da margem). Falta o Gabriel olhar a PDF.

## Como conferir

- Gerar a PDF: comando no `README.md` desta pasta.
- Ver os slides: `pdftoppm -r 40 -png docs/CineON-apresentacao-v2.pdf /tmp/p` e montar uma folha com as imagens.
- Achar sobreposição e texto vazando: abrir o `index.html` no Chrome headless com um script que compara os retângulos dos elementos de cada `section` (foi assim nesta sessão; o script ficou fora do repositório).

## Próximos passos

1. O Gabriel revisa a PDF nova.
2. Commit (só quando ele pedir), algo como `docs: padroniza o visual da apresentação v2`. Entram `docs/CineON-apresentacao-v2.pdf` e `docs/apresentacao-v2/` inteira. O `mobile/tsconfig.json` modificado é do Expo e não entra.
3. Ele comentou que talvez dê pra cortar mais slides: o foco da apresentação é AWS e banco de dados.

## Perguntas em aberto

1. Quais outros slides podem sair ou ser juntados?
2. O slide 8 (arquitetura) ficou com um vazio embaixo dos cartões. Preencher ou deixar?
