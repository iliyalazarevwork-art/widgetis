#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Widgetis — Production Deploy Script
# Usage: ./deploy.sh [--skip-pull] [--skip-migrate]
###############################################################################

REMOTE_DIR=/opt/widgetis
DC="docker compose -f docker-compose.prod.yml --env-file .env.prod"

SKIP_PULL=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case $arg in
    --skip-pull)    SKIP_PULL=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
  esac
done

echo "▶ Pulling latest code..."
git pull origin main

if [ "$SKIP_PULL" = false ]; then
  echo "▶ Building images..."
  $DC build --no-cache
fi

echo "▶ Starting services..."
$DC up -d --remove-orphans

echo "▶ Waiting for backend to be ready..."
sleep 5

if [ "$SKIP_MIGRATE" = false ]; then
  echo "▶ Running migrations..."
  $DC exec backend php artisan migrate --force
fi

echo "▶ Clearing and warming cache..."
$DC exec backend php artisan config:cache
$DC exec backend php artisan route:cache
$DC exec backend php artisan view:cache
$DC exec backend php artisan event:cache

echo "▶ Restarting queue workers..."
$DC restart queue-worker scheduler

echo ""
echo "✅  Deploy complete!"
echo "    Logs: docker compose -f docker-compose.prod.yml logs -f"
