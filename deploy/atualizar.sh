#!/usr/bin/env bash
# roda na EC2, de dentro de ~/CineON: bash deploy/atualizar.sh
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only

cd backend
npm ci
npm run build
set -a; source /etc/cineon.env; set +a
npx prisma migrate deploy

sudo systemctl restart cineon-api
sleep 2
curl -fsS http://localhost:3000/saude && echo " <- API no ar"
