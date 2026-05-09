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
  # Stream both outputs with a [lint]/[caddy] prefix so it's obvious which
  # job is making progress while we wait. Going silent for 30s during eslint
  # used to look like a hang.
  phase "local pre-flight (lint:fix + Caddyfile validate, parallel)"
  (
    cd frontend && npm run lint:fix 2>&1 | sed 's/^/   [lint]  /'
  ) &
  LINT_PID=$!

  CADDY_PID=""
  if [ -f Caddyfile ]; then
    (
      docker run --rm \
        -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
        caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile 2>&1 \
        | sed 's/^/   [caddy] /'
    ) &
    CADDY_PID=$!
  fi

  # ESLint failures are non-fatal (warnings ok). Caddy validate is fatal.
  wait "$LINT_PID" || true
  if [ -n "$CADDY_PID" ]; then
    if ! wait "$CADDY_PID"; then
      echo "❌ Caddyfile is invalid — aborting deploy"
      exit 1
    fi
    echo "   ✓ Caddyfile valid"
  fi
  phase_end

  # ── Pre-deploy: prod compose sanity check ────────────────────────────────
  # Catches a class of silent regressions where a service's env var defaults
  # are dev-only — the build succeeds, the container starts, but a runtime
  # call into a sibling service hits a port that nobody is listening on.
  # The Apr 11 FPM switchover broke `site-proxy → backend:8000` exactly this
  # way: no error in deploy, no crash in the container, just an empty demo
  # iframe in production for weeks.
  #
  # Plain YAML grep — `docker compose config` would resolve interpolations
  # (which we don't need) but requires prod's .env locally, which we don't
  # have. Our values here are static strings, so the raw file is enough.
  phase "prod compose sanity check"
  if [ -f docker-compose.prod.yml ]; then
    SITE_PROXY_BACKEND_URL=$(
      awk '
        /^  site-proxy:/             { in_svc = 1; next }
        in_svc && /^  [a-z]/         { in_svc = 0 }
        in_svc && /BACKEND_API_URL:/ {
          sub(/.*BACKEND_API_URL:[[:space:]]*/, "")
          sub(/[[:space:]]*#.*$/, "")
          gsub(/^"|"$/, "")
          print
          exit
        }
      ' docker-compose.prod.yml
    )
    if [ -z "$SITE_PROXY_BACKEND_URL" ]; then
      echo "❌ site-proxy.environment.BACKEND_API_URL is not set in docker-compose.prod.yml"
      echo "   The default (http://backend:8000) only works in dev — under prod's php-fpm"
      echo "   the backend doesn't listen on :8000 at all, so site-proxy → backend silently 404s."
      echo "   Set it to https://api.widgetis.com/api/v1 (or another reachable backend URL)."
      exit 1
    fi
    case "$SITE_PROXY_BACKEND_URL" in
      *backend:8000*)
        echo "❌ site-proxy.BACKEND_API_URL points at backend:8000, dead since the FPM switchover."
        echo "   Current value: $SITE_PROXY_BACKEND_URL"
        echo "   Set it to https://api.widgetis.com/api/v1."
        exit 1
        ;;
      http://*|https://*)
        echo "   ✓ site-proxy.BACKEND_API_URL = $SITE_PROXY_BACKEND_URL"
        ;;
      *)
        echo "❌ site-proxy.BACKEND_API_URL is not a valid http(s) URL: $SITE_PROXY_BACKEND_URL"
        exit 1
        ;;
    esac
  fi
  phase_end

  # If lint:fix changed anything — commit those fixes before pushing
  if ! git diff --quiet frontend/; then
    echo "▶ Committing ESLint auto-fixes..."
    git add frontend/
    git commit -m "chore(frontend): auto-fix eslint issues before deploy"
  fi

  phase "build demo bundle"
  DEMO_PROXY_PUBLIC_URL=https://preview.widgetis.com task build:demo
  phase_end

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
  echo "   ⏳ waiting for $svc (healthcheck=$has_hc) ..."

  local last_status=""
  local t0
  t0=$(date +%s)
  for i in $(seq 1 60); do
    cid=$($DC ps -q "$svc" | head -n1)
    [ -z "$cid" ] && { sleep 2; continue; }

    local elapsed=$(( $(date +%s) - t0 ))
    if [ "$has_hc" = "yes" ]; then
      local status
      status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$status" = "healthy" ]; then
        echo "   ✓ $svc healthy (${elapsed}s)"
        return 0
      fi
      # Print a heartbeat on first observation and on every status change so
      # the operator can see we're still alive and what's going on.
      if [ "$status" != "$last_status" ]; then
        echo "   … $svc status=$status (${elapsed}s)"
        last_status=$status
      elif [ $((i % 5)) -eq 0 ]; then
        echo "   … $svc still $status (${elapsed}s)"
      fi
    else
      local running
      running=$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
      if [ "$running" = "true" ]; then
        echo "   ✓ $svc running (no healthcheck, ${elapsed}s)"
        return 0
      fi
      if [ $((i % 5)) -eq 0 ]; then
        echo "   … $svc not running yet (${elapsed}s)"
      fi
    fi
    sleep 2
  done

  echo "   ⚠ $svc failed to become healthy in time — last logs:"
  $DC logs "$svc" --tail=30 || true
  echo "   (full: $DC logs $svc --tail=200)"
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
# in parallel (compose v2 build is sequential by default). BuildKit reuses
# cached layers — Dockerfiles are structured so dependency install (apt /
# composer / pnpm) sits above `COPY . .`, so the COPY layer (and only it)
# invalidates when the source changes. Use --no-cache-build to force a full
# rebuild when needed; --pull-base to re-pull base images.
if [ "$SKIP_BUILD" = false ]; then
  BUILD_FLAGS=""
  [ "${NO_CACHE_BUILD:-false}" = true ] && BUILD_FLAGS="$BUILD_FLAGS --no-cache"
  [ "${PULL_BASE:-false}"      = true ] && BUILD_FLAGS="$BUILD_FLAGS --pull"
  phase "docker build (parallel via bake${BUILD_FLAGS:+,$BUILD_FLAGS})"
  DOCKER_BUILDKIT=1 COMPOSE_BAKE=true $DC build $BUILD_FLAGS
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
  # Run migrations from a one-off container built from the *new* image.
  # `exec` would target the still-running OLD container, which doesn't yet
  # contain freshly-added migration files.
  if [ "$SKIP_MIGRATE" = false ]; then
    phase "migrations"
    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Enabling maintenance mode (--maintenance flag)..."
      $DC exec -T --user www-data backend php artisan down --retry=60 || true
    fi

    $DC run --rm --user www-data --no-deps backend php artisan migrate --force

    if [ "$MAINTENANCE" = true ]; then
      echo "▶ Disabling maintenance mode..."
      $DC exec -T --user www-data backend php artisan up || true
    fi
    phase_end
  fi

  # ── Step 4a: Backend MUST go first (the others may depend on its API) ────
  phase "rolling restart: backend"
  rolling_restart backend
  phase_end

  if [ "$SEED_BASE" = true ]; then
    phase "seed production reference data"
    $DC exec -T --user www-data backend php artisan db:seed --class=ProductionBootstrapSeeder --force
    phase_end
  fi

  # Idempotent seeders that maintain runtime invariants (e.g. admin-owned
  # test sites used by the widget Origin whitelist). Runs AFTER the backend
  # rolling restart so the new image (with any newly-added seeder classes)
  # is in the container.
  phase "seed admin test sites (idempotent)"
  $DC exec -T --user www-data backend php artisan db:seed --class=AdminTestSitesSeeder --force
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
  $DC rm -f -s queue-worker scheduler >/dev/null 2>&1 || true
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
