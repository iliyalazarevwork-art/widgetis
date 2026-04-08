# Mobile Visual Check (Docker)

Compare two URLs in a mobile viewport and produce baseline/candidate screenshots plus a visual diff.

## Run

```bash
docker compose --profile tools -f docker-compose.dev.yml run --rm visual-check \
  bash -lc "npm install --no-fund --no-audit && \
    node mobile-visual-check.mjs \
      --baseline-url http://host.docker.internal:3000/ \
      --candidate-url https://example.com/ \
      --name home \
      --max-diff-percent 3"
```

Artifacts are written to `tools/visual-check/results/`.

## Useful flags

- `--width 390 --height 844` (default iPhone-like viewport)
- `--wait-ms 1200`
- `--full-page`
- `--baseline-selector '#app'`
- `--candidate-selector '#app'`
- `--out-dir ./results`
