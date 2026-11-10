-- Usuário só com o que a API precisa. As migrações continuam rodando com o master do RDS.
-- Rodar uma vez, como master, depois do prisma migrate deploy.
CREATE USER cineon_app WITH PASSWORD 'TROQUE-POR-UMA-SENHA-FORTE';

GRANT CONNECT ON DATABASE postgres TO cineon_app;
GRANT USAGE ON SCHEMA public TO cineon_app;

-- só leitura e escrita, nada de DROP/ALTER/TRUNCATE
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cineon_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cineon_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cineon_app;
GRANT EXECUTE ON PROCEDURE sp_gerar_assentos_sala(int, int, int) TO cineon_app;

-- a API não pode mexer no log de auditoria
REVOKE UPDATE, DELETE ON log_auditoria FROM cineon_app;
REVOKE ALL ON _prisma_migrations FROM cineon_app;

-- vale também para tabelas criadas em migrações futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cineon_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cineon_app;
