# Apresentação v2

## TL;DR

A PDF da apresentação sai do `index.html` pelo Chrome. As regras do visual estão no fim deste arquivo e o andamento em `progresso.md`.

- `index.html`: fonte da `docs/CineON-apresentacao-v2.pdf`.
- `recriacao.html`: cópia fiel da `docs/CineON-apresentacao.pdf` original, refeita em HTML. Serve de base para comparar.
- `progresso.md`: onde paramos e o que falta (ler primeiro numa sessão nova).
- `img/`: telas extraídas da PDF original, sem perda. `fonts/`: fontes locais. Títulos em Inter Display (Inter com o eixo `opsz` em 32, peso 700), texto em Inter, código em JetBrains Mono. Instrument Serif (itálico) só nas taglines dos filmes. Bricolage Grotesque só na recriação.

Gerar a PDF (slides de 1920×1080, Chrome sem cabeçalho):

```bash
google-chrome --headless=new --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf=docs/CineON-apresentacao-v2.pdf "file://$PWD/docs/apresentacao-v2/index.html"
```

## Regras do visualr

As variáveis e os componentes ficam no topo do `<style>` do `index.html`. Slide novo usa só o que está aqui.

- **Fundo:** alterna. Slide ímpar é preto, slide par é branco (pedido do Gabriel em 24/11). Ao tirar ou pôr um slide, a alternância continua pela ordem nova.
- **Cores:** `--fg` e `--mut` (um cinza só por tema) pro texto, `--sup` pros cartões (cinza `#f5f5f7` no branco, `#1c1c1e` no preto), um azul só (`--azul`, `#0a84ff`). Verde e vermelho (`--ok`, `--erro`) só pra resultado certo/errado. Exceção: o slide de design usa as cores de cada pôster.
- **Texto:** 18 rótulo (maiúsculo, espaçado), 22 pequeno, 26 texto, 30 item e destaque, 44 subtítulo, 84 título, 104 display (números e frases de impacto), 200 herói (capa, fim e número grande). Títulos e números em Inter Display; código em JetBrains Mono.
- **Grade:** margem de 140 dos dois lados. Rótulo em 112, título em 157 (a segunda linha em 247), conteúdo em 380 (ou 470 com título de duas linhas). Telas e código ao lado do texto começam na altura do título (157). Nada passa de 968, a não ser celular que sai pela borda de baixo de propósito.
- **Título:** uma linha sempre que couber. Duas só quando o conteúdo fica numa coluna à esquerda.
- **Cartão:** grupo de itens paralelos (título + descrição, ou número + legenda) fica sempre em cartões iguais (`.cartao.bloco`): papéis (3), restrições (11), segurança (17), critérios (20). Também ganha cartão o que é coisa real: caixa de diagrama, tabela, código, tela, filme. Lista numerada (`.lista`) não tem cartão. Dentro do cartão a descrição é 22.
- **Destaque:** fundo azul com texto branco (`.destaque`), igual em camada, cartão e tabela.
- **Números:** azul `01`, `02`… é ordem (`.lista`). Peso de critério é texto cinza ("peso 2").
- **Cantos:** 12 pra peças pequenas ou internas, 24 pra cartões e código, 42 pro celular. Pílula é sempre a mesma (`.pilula`, 48 de altura).
- **Sem separadores:** nada de linha entre itens. Linha só em diagrama (setas e ligações entre tabelas).
- **Rodapé:** número da página em todo slide, menos na capa.
- **Rótulo (eyebrow):** diz em que parte da apresentação o slide está, não repete o título. Partes: O PROBLEMA, O APP, ARQUITETURA, BANCO DE DADOS, PRODUÇÃO E QUALIDADE, AVALIAÇÃO.
- **Padding ótico:** `.cartao` e `.codigo` usam `text-box: trim-both cap alphabetic`, que corta o espaço extra da fonte em cima e embaixo. Assim o padding parece igual nos quatro lados. Código não tem altura fixa: o padding define.
- **Sem "·":** informações de tipos diferentes ganham estilos diferentes (rótulo + valor, código em mono, peso). Itens do mesmo tipo vão com vírgula ou "e".
- **Vocabulário:** "bilheteria", nunca "balcão" (a tela do app ainda mostra "Venda no balcão", é print).
