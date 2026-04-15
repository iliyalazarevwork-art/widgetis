#!/usr/bin/env bash
# Auto-fix code style issues across backend and frontend.
# Usage: ./fix.sh [--backend-only] [--frontend-only]

set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"
BACKEND=true
FRONTEND=true

for arg in "$@"; do
    case $arg in
        --backend-only)  FRONTEND=false ;;
        --frontend-only) BACKEND=false  ;;
    esac
done

if $BACKEND; then
    echo "▶ Backend: pint (PHP style auto-fix)..."
    $COMPOSE exec backend ./vendor/bin/pint
    echo ""
fi

if $FRONTEND; then
    echo "▶ Frontend: eslint --fix..."
    $COMPOSE exec frontend npm run lint:fix 2>/dev/null || \
        docker compose -f docker-compose.dev.yml exec -T frontend npx eslint --fix 'src/**/*.{ts,tsx}' 2>/dev/null || \
        (cd frontend && npx eslint --fix 'src/**/*.{ts,tsx}') || true
    echo ""
fi

echo "✓ Auto-fix complete."
