# CineON — Deploy em produção (AWS, sem custo)

Arquitetura (a mesma da Aula 12 de P2):

```
Celular (Expo Go) / Navegador
          │ HTTPS  (https://SEU-DOMINIO)
          ▼
   EC2 Ubuntu ── nginx (80/443, certbot) ─┬─► /      app Web estático (/var/www/cineon)
          │                               └─► /api   Node.js API :3000 (systemd)
          │ 5432 (rede privada da VPC, com SSL)
          ▼
   RDS PostgreSQL (gerenciado)
```

App e API ficam no **mesmo endereço**: o app na raiz e a API em `/api` (o nginx tira o prefixo e repassa pro Node). Assim só precisa de um nome de domínio e o navegador não faz CORS.

Arquivos prontos em [deploy/](../deploy): `cineon-api.service`, `nginx-cineon.conf`, `atualizar.sh` e `permissoes.sql`.

## Custo zero: o que garante

- A conta é criada no **Plano Gratuito** da AWS (contas novas, desde jul/2025). Nesse plano o cartão não é cobrado: o uso sai dos créditos que a AWS dá (US$ 100 na criação, mais créditos por completar atividades como subir uma EC2, um RDS e criar um orçamento). Se os créditos acabarem ou passarem os 6 meses, a conta é pausada, não cobrada. **Não clique em "Upgrade to paid plan".**
- O domínio é o do professor, que cria o registro apontando pro nosso IP.
- Ficam de fora, de propósito: Secrets Manager, Multi-AZ, Load Balancer, NAT Gateway, Route 53 e snapshot final do RDS.
- EC2 + RDS + IPv4 público consomem uns US$ 25 de crédito por mês em Ohio. Sobra bastante até a apresentação.

## 1. Conta AWS (uma vez)
1. Criar a conta em `aws.amazon.com/free` e escolher **Free plan** (plano gratuito).
2. Ativar MFA no usuário root.
3. **Billing → Budgets → Create budget → Zero spend budget**, com o e-mail da equipe. Avisa se qualquer centavo sair dos créditos.
4. Usar a mesma região pra tudo (canto superior direito do console). A nossa ficou em **Ohio (`us-east-2`)**, que gasta menos crédito que São Paulo. Se o RDS ficar em outra região, ele não enxerga a EC2.

## 2. EC2
1. EC2 → *Launch instance*, nome `cineon-api`.
2. AMI **Ubuntu Server 24.04 LTS**, tipo **`t3.micro`**.
3. *Key pair*: criar `cineon` (RSA, `.pem`) e guardar o arquivo.
4. *Network settings*: permitir SSH **só do meu IP**, HTTP e HTTPS de qualquer lugar.
5. *Storage*: 20 GiB gp3 (até 30 GiB entra no free tier).
6. Depois de criada: EC2 → *Elastic IPs* → *Allocate* → *Associate* com a `cineon-api`. Elastic IP solto (sem instância) é cobrado à parte, então sempre deixe associado ou libere.

## 3. RDS PostgreSQL
RDS → *Create database*. Pode ser **Easy create** (como no slide) ou **Standard create**; nos dois:

| Campo | Valor |
|---|---|
| Engine | **PostgreSQL** (não o Aurora) |
| Templates / tamanho | **Free tier** |
| DB instance identifier | `cineon-db` |
| Master username | `postgres` |
| Credentials management | **Self managed** (o Secrets Manager é cobrado) |
| Master password | só letras e números, **anote** |
| Instance class | `db.t4g.micro` ou `db.t3.micro` |
| Storage | 20 GiB, **sem** *storage autoscaling* |
| Connectivity | **Connect to an EC2 compute resource** → `cineon-api` |
| Public access | **No** (o banco só é visto pela EC2) |
| Monitoring | sem Performance Insights e sem Enhanced Monitoring |
| Initial database name (só no Standard) | `cineon` (no Easy create o banco é o `postgres`) |
| Backup retention (só no Standard) | 1 dia |

Copiar o **endpoint** (algo como `cineon-db.xxxx.us-east-2.rds.amazonaws.com`).

> O RDS com PostgreSQL 15+ só aceita conexão com SSL. Por isso a `DATABASE_URL` leva `sslmode=require` e o Node recebe o certificado da Amazon por `NODE_EXTRA_CA_CERTS` (passo 5). A extensão `btree_gist` (da constraint EXCLUDE) é suportada no RDS e a migração cria ela com o usuário master.

## 4. Domínio
Passar pro professor o nome desejado (ex.: `cineon.DOMINIO-DO-PROFESSOR`) e o **Elastic IP**. Ele cria um registro **A** apontando o nome pro IP.

Enquanto o DNS não fica pronto, tudo funciona por `http://<ELASTIC-IP>`. O HTTPS (passo 6) entra depois.

## 5. Servidor (via SSH)
```bash
ssh -i cineon.pem ubuntu@<ELASTIC-IP>

# 2 GB de swap: a t3.micro tem 1 GB de RAM e o build passa disso
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Node 22 LTS, nginx, git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# certificado do RDS, pro Node aceitar o SSL do banco
sudo curl -fsSL -o /etc/ssl/certs/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

git clone https://github.com/lucassmagro/CineON.git
cd CineON/backend

# variáveis de ambiente FORA do repositório
sudo tee /etc/cineon.env > /dev/null <<EOF
DATABASE_URL="postgresql://postgres:SENHA-DO-RDS@ENDPOINT-DO-RDS:5432/cineon?schema=public&sslmode=require"
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem
JWT_SECRET=$(openssl rand -hex 32)
JWT_MINUTOS=120
PORT=3000
RESERVA_MINUTOS=10
CORS_ORIGENS=https://SEU-DOMINIO
EOF
sudo chmod 600 /etc/cineon.env && sudo chown ubuntu:ubuntu /etc/cineon.env

npm ci && npm run build
set -a; source /etc/cineon.env; set +a
npx prisma migrate deploy                 # cria tabelas, triggers, procedure e função no RDS
SEED_SENHA='senha-da-demo' npm run seed   # só na primeira vez
```

> **Senha da seed:** o repositório é público e a senha padrão `cineon123` está nele. Em produção a seed roda com `SEED_SENHA`, e só a equipe sabe a senha dos usuários de demonstração.

> Se a senha do RDS tiver `@`, `:`, `/` ou `#`, ela precisa ir codificada na URL (`@` vira `%40`). Mais fácil escolher uma senha só com letras e números.

> As **aspas** na `DATABASE_URL` são obrigatórias: sem elas o `source` lê o `&` da URL como "rodar em segundo plano", a variável fica vazia e o `migrate deploy` reclama que falta o `datasource.url`. O systemd entende as aspas.

## 6. systemd + nginx + HTTPS
```bash
sudo cp ~/CineON/deploy/cineon-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now cineon-api
sudo systemctl status cineon-api        # logs: sudo journalctl -u cineon-api -f

sudo cp ~/CineON/deploy/nginx-cineon.conf /etc/nginx/sites-available/cineon
sudo ln -s /etc/nginx/sites-available/cineon /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/cineon
sudo nginx -t && sudo systemctl reload nginx
curl http://localhost/api/saude         # {"status":"ok","banco":true}
```

Quando o professor avisar que o domínio aponta pro IP (`nslookup SEU-DOMINIO` mostra o Elastic IP):
```bash
sudo sed -i 's/server_name _;/server_name SEU-DOMINIO;/' /etc/nginx/sites-available/cineon
sudo nginx -t && sudo systemctl reload nginx
sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d SEU-DOMINIO
curl https://SEU-DOMINIO/api/saude
```

## 7. App
- **Web**: o build usa a API pelo caminho relativo `/api`, então o mesmo build funciona pelo IP e pelo domínio. Na máquina de desenvolvimento, dentro de `mobile/`, **pelo PowerShell**:
  ```powershell
  $env:EXPO_PUBLIC_API_URL = '/api'; npx expo export -p web --clear
  ```
  Dois cuidados: no Git Bash o `/api` vira `C:/Program Files/Git/api` (conversão de caminho do MSYS), e sem o `--clear` o Metro reaproveita o cache com a URL antiga. Pra conferir: `dist/_expo/static/js/web/entry-*.js` tem que ter `"/api".replace`. Depois, de volta no Git Bash, na raiz:
  ```bash
  scp -i cineon.pem -r mobile/dist ubuntu@<ELASTIC-IP>:/tmp/web
  ssh -i cineon.pem ubuntu@<ELASTIC-IP> 'sudo rm -rf /var/www/cineon/* && sudo cp -r /tmp/web/* /var/www/cineon/ && rm -rf /tmp/web'
  ```
- **Celular**: no `mobile/.env`, `EXPO_PUBLIC_API_URL=https://SEU-DOMINIO/api`, rode `npx expo start` e abra no **Expo Go**. O app conversa com a API de produção.

## 8. Permissões mínimas (opcional, conta pontos em BD2)
Rode [deploy/permissoes.sql](../deploy/permissoes.sql) como master e troque a `DATABASE_URL` do `/etc/cineon.env` para o usuário `cineon_app`. As migrações futuras continuam rodando com o master.

## 9. Atualizações
```bash
cd ~/CineON && bash deploy/atualizar.sh
```

## 10. Depois da avaliação
1. RDS → `cineon-db` → *Delete*, **desmarcar** "Create final snapshot" (snapshot guardado consome crédito).
2. EC2 → *Terminate* na `cineon-api`.
3. *Elastic IPs* → *Release*.

No Plano Gratuito nada disso gera cobrança, mas desligar preserva os créditos e não deixa dados de demonstração no ar.
