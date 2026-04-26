#!/usr/bin/env bash
set -euo pipefail

# ── Phase timing helpers ─────────────────────────────────────────────────────
# Each major step is wrapped in phase / phase_end. At script exit we print a
# summary so it's obvious where the deploy is spending time.
SCRIPT_T0=$(date +%s)
TIMINGS=()
PHASE_T0=0
PHASE_LABEL=""
phase() {
  PHASE_LABEL=$1
  PHASE_T0=$(date +%s)
  echo ""
  echo "▶▶▶ [+$((PHASE_T0 - SCRIPT_T0))s] $PHASE_LABEL"
}
phase_end() {
  local now dur
  now=$(date +%s)
  dur=$((now - PHASE_T0))
  TIMINGS+=("$(printf '%4ds  %s' "$dur" "$PHASE_LABEL")")
  echo "◀◀◀ [${dur}s] $PHASE_LABEL"
}
print_timings() {
  echo ""
  echo "── Phase timings ──────────────────────────────"
  for line in "${TIMINGS[@]}"; do echo "  $line"; done
  echo "  ────────────────────────────────────────────"
  echo "  TOTAL: $(($(date +%s) - SCRIPT_T0))s"
}
trap print_timings EXIT

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
    phase "encrypt secrets (sops)"
    SOPS_AGE_KEY_FILE=.age-key.txt sops \
      --input-type dotenv --output-type dotenv \
      --encrypt backend/.env.production > backend/.env.production.enc
    echo "   ✓ backend/.env.production.enc updated"
    phase_end
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

  # ── Pre-deploy: lint:fix + Caddyfile validate (parallel) ─────────────────
  # Independent, both local — no reason to wait for one before the other.
  phase "local pre-flight (lint:fix + Caddyfile validate, parallel)"
  (
    cd frontend && npm run lint:fix
  ) >/tmp/lintfix.log 2>&1 &
  LINT_PID=$!

  CADDY_PID=""
  if [ -f Caddyfile ]; then
    docker run --rm \
      -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
      caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile \
      >/tmp/caddy-validate.log 2>&1 &
    CADDY_PID=$!
  fi

  # ESLint failures are non-fatal (warnings ok); we just collect output.
  wait "$LINT_PID" || true
  cat /tmp/lintfix.log
  if [ -n "$CADDY_PID" ]; then
    if ! wait "$CADDY_PID"; then
      echo "❌ Caddyfile is invalid — aborting deploy:"
      cat /tmp/caddy-validate.log
      exit 1
    fi
    echo "   ✓ Caddyfile valid"
  fi
  phase_end

  # If lint:fix changed anything — commit those fixes before pushing
  if ! git diff --quiet frontend/; then
    echo "▶ Committing ESLint auto-fixes..."
    git add frontend/
    git commit -m "chore(frontend): auto-fix eslint issues before deploy"
  fi

  phase "git push"
  git push origin main
  phase_end

  phase "remote deploy (ssh)"
  ssh "$SERVER" "
    cd $REMOTE_DIR &&
    git pull origin main &&
    bash deploy.sh --local \
      $([ "$SKIP_BUILD"   = true ] && echo '--skip-build') \
      $([ "$SKIP_MIGRATE" = true ] && echo '--skip-migrate') \
      $([ "$SEED_BASE"    = true ] && echo '--seed-base') \
      $([ "$MAINTENANCE"  = true ] && echo '--maintenance')
  "
  phase_end
  echo ""
  echo "✅  Deploy complete! → https://widgetis.com"
  exit 0
fi

# ── Running ON the server ──────────────────────────────────────────────────────
cd "$REMOTE_DIR"

# ── Decrypt secrets from encrypted .env.production.enc ───────────────────────
phase "decrypt secrets"
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt
sops --input-type dotenv --output-type dotenv --decrypt backend/.env.production.enc > backend/.env
chmod 600 backend/.env
echo "   ✓ backend/.env ready"
phase_end

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
# COMPOSE_BAKE=true → docker buildx bake under the hood, builds all services
# in parallel (compose v2 build is sequential by default). BUILDKIT_INLINE_CACHE
# embeds layer cache hints into images so re-builds reuse cached layers.
if [ "$SKIP_BUILD" = false ]; then
  phase "docker build (parallel via bake)"
  DOCKER_BUILDKIT=1 BUILDKIT_INLINE_CACHE=1 COMPOSE_BAKE=true $DC build
  phase_end
fi

# ── Step 2: Ensure infra (postgres, redis, caddy) is up ───────────────────────
phase "infra up (postgres, redis)"
$DC up -d --no-deps postgres redis
wait_healthy postgres || true
phase_end

# Pre-deploy DB backup is triggered by Taskfile (`task prod:db:dump` runs
# before this script). When deploy.sh is invoked directly with --local on the
# server, make sure you snapshot the DB first — e.g. via `task prod:db:dump`
# from your workstation, or a manual pg_dump.

# First-ever deploy: if nothing is running at all, bring the full stack up
# in one shot (honors depends_on + healthchecks) and skip the rolling dance.
if [ -z "$($DC ps -q backend)" ]; then
  phase "first deploy: full stack up"
  $DC up -d --remove-orphans
  wait_healthy backend
  phase_end
else
  # ── Step 3: Migrations (optionally behind maintenance mode) ────────────────
  if [ "$SKIP_MIGRATE" = false ]; then
    phase "migrations"
    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Enabling maintenance mode (--maintenance flag)..."
      $DC exec -T --user www-data backend php artisan down --retry=60 || true
    fi

    $DC exec -T --user www-data backend php artisan migrate --force

    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Disabling maintenance mode..."
      $DC exec -T --user www-data backend php artisan up || true
    fi
    phase_end
  fi

  if [ "$SEED_BASE" = true ]; then
    phase "seed production reference data"
    $DC exec -T --user www-data backend php artisan db:seed --class=ProductionBootstrapSeeder --force
    phase_end
  fi

  # Always run idempotent seeders that maintain runtime invariants
  # (e.g. admin-owned test sites used by the widget Origin whitelist).
  phase "seed admin test sites (idempotent)"
  $DC exec -T --user www-data backend php artisan db:seed --class=AdminTestSitesSeeder --force
  phase_end

  # ── Step 4a: Backend MUST go first (the others may depend on its API) ────
  phase "rolling restart: backend"
  rolling_restart backend
  phase_end

  # ── Pre-launch test mode: wipe every non-admin user on every deploy ──────
  # Remove this block before going live.
  phase "purge non-admin users (test mode)"
  $DC exec -T --user www-data backend php artisan users:purge-non-admin --force
  phase_end

  # ── Step 4b: Recreate frontend / widget-builder / site-proxy in parallel.
  # They have no compose-level depends_on between them and Caddy holds client
  # connections open via lb_try_duration during the swap.
  phase "rolling restart: frontend + widget-builder + site-proxy (parallel)"
  $DC up -d --no-deps --force-recreate frontend widget-builder site-proxy

  pids=()
  wait_healthy frontend       & pids+=("$!:frontend")
  wait_healthy widget-builder & pids+=("$!:widget-builder")
  wait_healthy site-proxy     & pids+=("$!:site-proxy")
  fail=0
  for entry in "${pids[@]}"; do
    pid=${entry%%:*}
    name=${entry#*:}
    if ! wait "$pid"; then
      echo "❌ $name failed to become healthy"
      fail=1
    fi
  done
  [ "$fail" -eq 0 ] || exit 1
  phase_end

  # ── Step 5: Background workers — safe to hard-restart ────────────────────
  phase "recreate queue-worker + scheduler"
  $DC up -d --no-deps --force-recreate queue-worker scheduler
  phase_end

  # ── Step 6: Ensure Caddy is running (no restart needed — it auto-reresolves
  # upstreams thanks to Docker DNS + lb_try_duration retries).
  phase "ensure caddy up"
  $DC up -d --no-deps caddy
  phase_end
fi

echo ""
echo "==> Service status:"
$DC ps --format 'table {{.Name}}\t{{.Status}}'

echo ""
echo "✅  Deploy complete!"
