#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Widgetis — Zero-Downtime Remote Deploy Script
#
# Run locally:  ./deploy.sh
# Run on server: bash /opt/widgetis/deploy.sh --local
#
# Strategy:
#   1. Build all images up-front WITHOUT touching running containers.
#   2. Rolling-restart services one by one; for each, wait until the new
#      container reports "healthy" (per compose healthcheck) before moving on.
#   3. Caddy is configured with lb_try_duration so client requests are held
#      and retried while an upstream is briefly unavailable — no 502/white
#      screen, no .txt download.
#   4. Migrations run WITHOUT artisan down by default (most migrations are
#      additive). Use --maintenance if a migration is destructive and the
#      old code can't run against the new schema.
#
# Flags:
#   --local         Run directly on the server (no SSH hop)
#   --skip-build    Skip docker build (faster if only config changed)
#   --skip-migrate  Skip migrations
#   --seed-base     Seed only production-safe reference data
#   --maintenance   Enable Laravel maintenance mode around migrations
#                   (only for destructive migrations)
###############################################################################

SERVER=root@204.168.206.10
REMOTE_DIR=/opt/widgetis

LOCAL=false
SKIP_BUILD=false
SKIP_MIGRATE=false
SEED_BASE=false
MAINTENANCE=false

for arg in "$@"; do
  case $arg in
    --local)        LOCAL=true ;;
    --skip-build)   SKIP_BUILD=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    --seed-base)    SEED_BASE=true ;;
    --maintenance)  MAINTENANCE=true ;;
  esac
done

# ── If called locally — SSH into server and re-run this script ────────────────
if [ "$LOCAL" = false ]; then
  # ── Pre-deploy: encrypt .env.production → .env.production.enc ────────────────
  if [ -f backend/.env.production ]; then
    echo "▶ Encrypting backend/.env.production..."
    SOPS_AGE_KEY_FILE=.age-key.txt sops \
      --input-type dotenv --output-type dotenv \
      --encrypt backend/.env.production > backend/.env.production.enc
    echo "   ✓ backend/.env.production.enc updated"
  fi

  # If .env.production.enc changed — commit it
  if ! git diff --quiet backend/.env.production.enc 2>/dev/null || \
     git ls-files --error-unmatch backend/.env.production.enc 2>/dev/null | grep -q .; then
    if ! git diff --quiet backend/.env.production.enc; then
      echo "▶ Committing updated secrets..."
      git add backend/.env.production.enc
      git commit -m "chore(secrets): update encrypted production secrets"
    fi
  fi

  # ── Pre-deploy: auto-fix unused imports ───────────────────────────────────────
  echo "▶ Frontend: ESLint auto-fix (unused imports, style)..."
  (cd frontend && npm run lint:fix) || true   # fixes what it can; non-fixable issues stay as warnings

  # If lint:fix changed anything — commit those fixes before pushing
  if ! git diff --quiet frontend/; then
    echo "▶ Committing ESLint auto-fixes..."
    git add frontend/
    git commit -m "chore(frontend): auto-fix eslint issues before deploy"
  fi

  echo "▶ Pushing to GitHub..."
  git push origin main

  echo "▶ SSHing into $SERVER and running deploy..."
  ssh "$SERVER" "
    cd $REMOTE_DIR &&
    git pull origin main &&
    bash deploy.sh --local \
      $([ "$SKIP_BUILD"   = true ] && echo '--skip-build') \
      $([ "$SKIP_MIGRATE" = true ] && echo '--skip-migrate') \
      $([ "$SEED_BASE"    = true ] && echo '--seed-base') \
      $([ "$MAINTENANCE"  = true ] && echo '--maintenance')
  "
  echo ""
  echo "✅  Deploy complete! → https://widgetis.com"
  exit 0
fi

# ── Running ON the server ──────────────────────────────────────────────────────
cd "$REMOTE_DIR"

# ── Decrypt secrets from encrypted .env.production.enc ───────────────────────
echo "▶ Decrypting secrets..."
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt
sops --input-type dotenv --output-type dotenv --decrypt backend/.env.production.enc > backend/.env
chmod 600 backend/.env
echo "   ✓ backend/.env ready"

DC="docker compose -f docker-compose.prod.yml --env-file .env.prod"

# Wait until a given service reports state=healthy (or running if it has no
# healthcheck defined). Times out after ~120s.
wait_healthy() {
  local svc=$1
  local cid
  cid=$($DC ps -q "$svc" | head -n1)
  if [ -z "$cid" ]; then
    echo "   ⚠ $svc has no running container — skipping health wait"
    return 0
  fi

  local has_hc
  has_hc=$(docker inspect -f '{{if .State.Health}}yes{{else}}no{{end}}' "$cid" 2>/dev/null || echo "no")

  for i in $(seq 1 60); do
    cid=$($DC ps -q "$svc" | head -n1)
    [ -z "$cid" ] && { sleep 2; continue; }

    if [ "$has_hc" = "yes" ]; then
      local status
      status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$status" = "healthy" ]; then
        echo "   ✓ $svc healthy"
        return 0
      fi
    else
      local running
      running=$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
      if [ "$running" = "true" ]; then
        echo "   ✓ $svc running (no healthcheck)"
        return 0
      fi
    fi
    sleep 2
  done

  echo "   ⚠ $svc failed to become healthy in time — check: $DC logs $svc --tail=50"
  $DC logs "$svc" --tail=30 || true
  return 1
}

# Rolling-restart a single service: build (already done), then up -d --no-deps
# which recreates just that one service and leaves the rest untouched.
rolling_restart() {
  local svc=$1
  echo "▶ Rolling restart: $svc"
  $DC up -d --no-deps --force-recreate "$svc"
  wait_healthy "$svc"
}

# ── Step 1: Build all images first (no containers touched) ────────────────────
if [ "$SKIP_BUILD" = false ]; then
  echo "▶ Building images (containers keep running)..."
  DOCKER_BUILDKIT=1 $DC build
fi

# ── Step 2: Ensure infra (postgres, redis, caddy) is up ───────────────────────
echo "▶ Ensuring infra services are up..."
$DC up -d --no-deps postgres redis

# First-ever deploy: if nothing is running at all, bring the full stack up
# in one shot (honors depends_on + healthchecks) and skip the rolling dance.
if [ -z "$($DC ps -q backend)" ]; then
  echo "▶ First deploy / backend not running — starting full stack..."
  $DC up -d --remove-orphans
  wait_healthy backend
else
  # ── Step 3: Migrations (optionally behind maintenance mode) ────────────────
  if [ "$SKIP_MIGRATE" = false ]; then
    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Enabling maintenance mode (--maintenance flag)..."
      $DC exec -T --user www-data backend php artisan down --retry=60 || true
    fi

    echo "▶ Running migrations..."
    $DC exec -T --user www-data backend php artisan migrate --force

    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Disabling maintenance mode..."
      $DC exec -T --user www-data backend php artisan up || true
    fi
  fi

  if [ "$SEED_BASE" = true ]; then
    echo "▶ Seeding production-safe reference data..."
    $DC exec -T --user www-data backend php artisan db:seed --class=ProductionBootstrapSeeder --force
  fi

  # ── Step 4: Rolling restart of user-facing services ──────────────────────
  # Order matters: backend first (API), then SPAs / proxies on top.
  # Caddy's lb_try_duration absorbs the brief gap while each container swaps.
  rolling_restart backend

  # ── Pre-launch test mode: wipe every non-admin user on every deploy ──────
  # Remove this block before going live.
  echo "▶ Purging non-admin users (test-mode cleanup)..."
  $DC exec -T --user www-data backend php artisan users:purge-non-admin --force

  rolling_restart frontend
  rolling_restart widget-builder
  rolling_restart site-proxy

  # ── Step 5: Background workers — safe to hard-restart ────────────────────
  echo "▶ Recreating queue worker and scheduler..."
  $DC up -d --no-deps --force-recreate queue-worker scheduler

  # ── Step 6: Ensure Caddy is running (no restart needed — it auto-reresolves
  # upstreams thanks to Docker DNS + lb_try_duration retries).
  $DC up -d --no-deps caddy
fi

echo ""
echo "==> Service status:"
$DC ps --format 'table {{.Name}}\t{{.Status}}'

echo ""
echo "✅  Deploy complete!"
