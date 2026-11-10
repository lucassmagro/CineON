# CineON — Deploy em produção (AWS)

Arquitetura (a mesma da Aula 12 de P2):

```
Celular (Expo Go) / Navegador
          │ HTTPS
          ▼
   EC2 Ubuntu ── nginx (80/443, certbot) ──► Node.js API :3000 (systemd)
          │                     └──► /var/www/cineon (app Web estático)
          │ 5432 (rede privada da VPC)
          ▼
   RDS PostgreSQL (gerenciado)
```

Arquivos prontos em [deploy/](../deploy): `cineon-api.service`, `nginx-cineon.conf`, `atualizar.sh` e `permissoes.sql`.

## 1. Conta AWS (uma vez)
- Criar a conta, ativar MFA no root e criar um alerta no **AWS Budgets** (ex.: US$ 5).
- Usar a mesma região para tudo (ex.: `us-east-1` ou `sa-east-1`).

## 2. EC2
1. EC2 → *Launch instance* → AMI **Ubuntu Server** (free tier) → tipo free tier (`t3.micro`/`t2.micro`).
2. *Key pair*: criar e guardar o `.pem`.
3. *Security group*: SSH 22 **só do seu IP**, HTTP 80 e HTTPS 443 de qualquer lugar.
4. Associar um **Elastic IP**, para o IP não mudar quando a instância reiniciar.

## 3. RDS PostgreSQL
1. RDS → *Create database* → PostgreSQL 16 → *Free tier*.
2. Usuário master `postgres` e uma senha forte (**anote**).
3. *Connectivity*: **Connect to an EC2 compute resource** → escolher a EC2 (o banco fica privado, acessível só pela EC2).
4. Copiar o **endpoint**.

> A extensão `btree_gist` (usada pela constraint EXCLUDE) é suportada no RDS. A migração executa `CREATE EXTENSION IF NOT EXISTS btree_gist` com o usuário master.

## 4. Domínio
O certbot precisa de um nome de domínio apontando para o Elastic IP. Opções:
- um domínio do grupo (registros A `api.` e `app.`); ou
- subdomínios gratuitos do **DuckDNS** (ex.: `cineon-api.duckdns.org` e `cineon-app.duckdns.org`).

## 5. Servidor (via SSH)
```bash
ssh -i chave.pem ubuntu@<ELASTIC-IP>

# Node 22 LTS, nginx, git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

git clone https://github.com/lucassmagro/CineON.git
cd CineON/backend

# variáveis de ambiente FORA do repositório
sudo tee /etc/cineon.env > /dev/null <<'EOF'
DATABASE_URL=postgresql://postgres:SENHA@ENDPOINT-DO-RDS:5432/postgres?schema=public
JWT_SECRET=<gere com: openssl rand -hex 32>
JWT_MINUTOS=120
PORT=3000
RESERVA_MINUTOS=10
CORS_ORIGENS=https://app.SEU-DOMINIO
EOF
sudo chmod 600 /etc/cineon.env && sudo chown ubuntu:ubuntu /etc/cineon.env

npm ci && npm run build
set -a; source /etc/cineon.env; set +a
npx prisma migrate deploy     # cria tabelas, triggers, procedure e função no RDS
npm run seed                  # só na primeira vez (dados de demonstração)
```

## 6. systemd + nginx + HTTPS
```bash
sudo cp ~/CineON/deploy/cineon-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now cineon-api
sudo systemctl status cineon-api        # logs: sudo journalctl -u cineon-api -f

sudo cp ~/CineON/deploy/nginx-cineon.conf /etc/nginx/sites-available/cineon
sudo sed -i 's/SEU-DOMINIO/seu.dominio/g' /etc/nginx/sites-available/cineon
sudo ln -s /etc/nginx/sites-available/cineon /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d api.seu.dominio -d app.seu.dominio
curl https://api.seu.dominio/saude      # {"status":"ok","banco":true}
```

## 7. App
- **Web**: na máquina de desenvolvimento, coloque `EXPO_PUBLIC_API_URL=https://api.seu.dominio` no `mobile/.env`, rode `npm run build:web` e copie `mobile/dist/` para `/var/www/cineon` na EC2 (`scp -r dist/* ubuntu@IP:/tmp/web && sudo cp -r /tmp/web/* /var/www/cineon/`).
- **Celular**: com o mesmo `.env`, rode `npx expo start` e abra no **Expo Go**. O app conversa com a API de produção.

## 8. Permissões mínimas (opcional, conta pontos em BD2)
Rode [deploy/permissoes.sql](../deploy/permissoes.sql) como master e troque a `DATABASE_URL` do `/etc/cineon.env` para o usuário `cineon_app`. As migrações futuras continuam rodando com o master.

## 9. Atualizações
```bash
cd ~/CineON && bash deploy/atualizar.sh
```

## 10. Depois da avaliação
Encerrar a EC2 (*terminate*), excluir o RDS e liberar o Elastic IP, para não gerar cobrança.
