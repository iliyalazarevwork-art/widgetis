#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Widgetis — First-time server setup
# Run once on a fresh server: bash server-setup.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SERVER=root@204.168.206.10
REMOTE=/opt/widgetis
REPO=git@github.com:iliyalazarevwork-art/widgetis.git

echo "▶ Installing Docker on server..."
ssh $SERVER "which docker || (curl -fsSL https://get.docker.com | sh)"

echo "▶ Cloning repo to $REMOTE..."
ssh $SERVER "
  mkdir -p $REMOTE && cd $REMOTE &&
  git clone $REPO . || git pull origin main
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Now create env files on the server:"
echo ""
echo "  ssh $SERVER"
echo "  cd $REMOTE"
echo ""
echo "  1) Generate keys:"
echo "     docker compose -f docker-compose.prod.yml --env-file .env.prod \\"
echo "       run --rm backend php artisan key:generate --show"
echo "     docker compose -f docker-compose.prod.yml --env-file .env.prod \\"
echo "       run --rm backend php artisan jwt:secret --show"
echo ""
echo "  2) Create backend/.env  (copy from backend/.env.production template)"
echo "  3) Create .env.prod     (DB_PASSWORD + REDIS_PASSWORD)"
echo ""
echo "  Then run: bash deploy.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
