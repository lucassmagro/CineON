# Progresso da apresentação v3

## TL;DR

A v3 (`docs/CineON-apresentacao.pdf`, 11 slides) é a v2 enxugada: uma ideia por slide, com o peso em banco e AWS. O visual segue o `README.md` desta pasta. As versões anteriores (a primeira e a v2) saíram do repositório em 24/11 e ficam só no histórico do Git. Próximo passo: o Gabriel revisar a PDF.

## O que mudou da v2 (24/11/2026)

O plano ficava em `docs/apresentacao-v2/plano-enxugar.md`, que saiu junto com a v2.

- O app (slides 3, 4, 6 e 7 da v2) virou um slide: três celulares, uma frase por papel.
- A arquitetura ficou só com as camadas e o código (slide 9 da v2). O nginx, a EC2 e o RDS ficam só no slide da AWS.
- As 4 migrações viraram uma linha embaixo do título do modelo do banco.
- A concorrência (slides 13 e 14 da v2) virou um slide: 20 pedidos à esquerda, o código de antes e de depois à direita.
- A segurança passou de 8 para 4 cartões em 2×2 à esquerda, sem os trechos de código. À direita, um bloco com o código real do login (bcrypt, JWT com prazo) e da checagem de papel (403), alinhado com os cartões. O HTTPS e os segredos viraram notas no slide da AWS.
- Os testes viraram uma frase no slide da concorrência ("Um dos 17 testes automatizados"). A tabela dos critérios desceu pra linha 380, com linhas de 64.
- Saíram a identidade visual, os números do banco e o slide dos testes.
- Segundo corte, pedido do Gabriel (24/11): saíram o slide das regras nos services e o "Agora, ao vivo". No slide da AWS saiu o "R$ 0" (as notas de HTTPS e segredos foram pro lugar dele). Os critérios ficaram sem título e sem a coluna de peso.
- A v2.5 (`docs/apresentacao-v2.5/`, 17 slides, meio-termo) foi testada e descartada: seguimos com a v3.
