#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Widgetis — Remote Deploy Script
#
# Run locally:  ./deploy.sh
# Run on server: bash /opt/widgetis/deploy.sh --local
#
# Flags:
#   --local         Run directly on the server (no SSH hop)
#   --skip-build    Skip docker build (faster if only config changed)
#   --skip-migrate  Skip migrations
#   --seed-base     Seed only production-safe reference data
###############################################################################

SERVER=root@204.168.206.10
REMOTE_DIR=/opt/widgetis

LOCAL=false
SKIP_BUILD=false
SKIP_MIGRATE=false
SEED_BASE=false

for arg in "$@"; do
  case $arg in
    --local)        LOCAL=true ;;
    --skip-build)   SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --seed-base)    SEED_BASE=true ;;
  esac
done

# ── If called locally — SSH into server and re-run this script ────────────────
if [ "$LOCAL" = false ]; then
  echo "▶ Pushing to GitHub..."
  git push origin main

  echo "▶ SSHing into $SERVER and running deploy..."
  ssh "$SERVER" "
    cd $REMOTE_DIR &&
    git pull origin main &&
    bash deploy.sh --local \
      $([ "$SKIP_BUILD" = true ] && echo '--skip-build') \
      $([ "$SKIP_MIGRATE" = true ] && echo '--skip-migrate') \
      $([ "$SEED_BASE" = true ] && echo '--seed-base')
  "
  echo ""
  echo "✅  Deploy complete! → http://$SERVER"
  exit 0
fi

# ── Running ON the server ──────────────────────────────────────────────────────
cd "$REMOTE_DIR"
DC="docker compose -f docker-compose.prod.yml --env-file .env.prod"

if [ "$SKIP_BUILD" = false ]; then
  echo "▶ Building images..."
  DOCKER_BUILDKIT=1 $DC build
fi

echo "▶ Starting services..."
$DC up -d --remove-orphans

echo "▶ Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if $DC exec -T backend php artisan --version > /dev/null 2>&1; then
    echo "   Backend ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "   ⚠ Backend timeout — check logs: $DC logs backend"
    $DC logs backend --tail=20
  fi
  sleep 2
done

echo "▶ Putting the app into maintenance mode..."
$DC exec -T backend php artisan down --retry=60

if [ "$SKIP_MIGRATE" = false ]; then
  echo "▶ Running migrations..."
  $DC exec -T backend php artisan migrate --force
fi

if [ "$SEED_BASE" = true ]; then
  echo "▶ Seeding production-safe reference data..."
  $DC exec -T backend php artisan db:seed --class=ProductionBootstrapSeeder --force
fi

echo "▶ Warming cache..."
$DC exec -T backend php artisan config:cache
$DC exec -T backend php artisan route:cache
$DC exec -T backend php artisan view:cache
$DC exec -T backend php artisan event:cache

echo "▶ Restarting queue workers..."
$DC restart queue-worker scheduler

echo "▶ Bringing the app back online..."
$DC exec -T backend php artisan up

echo "▶ Restarting caddy (re-resolves container IPs)..."
$DC restart caddy

echo ""
echo "==> Service status:"
$DC ps --format 'table {{.Name}}\t{{.Status}}'

echo ""
echo "✅  Deploy complete!"
