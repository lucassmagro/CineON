# Backup do banco

[cineon-backup-2026-11-24.sql](cineon-backup-2026-11-24.sql) é um `pg_dump` (PostgreSQL 16, SQL puro) do banco de desenvolvimento do CineON, tirado em 24/11/2026.

## O que tem

- **Estrutura completa**: as 11 tabelas com chaves primárias e estrangeiras, `CHECK`s, índices (inclusive o único parcial `ux_ingressos_assento_ativo`), o `EXCLUDE` que impede sessões sobrepostas na mesma sala, a procedure `sp_gerar_assentos_sala`, a função `fn_relatorio_ocupacao` e as triggers `trg_sessao_gera_mapa`, `trg_auditoria_reservas` e `trg_auditoria_ingressos`.
- **Dados**: 4 salas com 236 assentos, 7 filmes, 99 sessões, 6.468 assentos de sessão, 651 reservas, 648 pagamentos, 1.549 ingressos, 3.028 registros de auditoria, 24 usuários e o histórico de 4 migrações do Prisma.

São os dados da seed somados ao que os testes automáticos criam (filmes, usuários e compras de teste). Os usuários são fictícios; os da seed usam a senha `cineon123`.

## Como restaurar

Num banco PostgreSQL vazio:

```bash
createdb cineon_backup
psql -d cineon_backup -f cineon-backup-2026-11-24.sql
```

O arquivo usa `\restrict`, que o `psql` só entende a partir da versão 16.10. Com o container do projeto (`backend/docker-compose.yml`) dá certo:

```bash
docker exec backend-db-1 createdb -U postgres cineon_backup
docker exec -i backend-db-1 psql -U postgres -d cineon_backup < docs/banco/cineon-backup-2026-11-24.sql
```

O backup foi conferido restaurando num banco novo: todas as tabelas voltaram com o mesmo número de linhas do original.
