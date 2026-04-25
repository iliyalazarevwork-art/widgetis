# Модулі Widget Builder

## Документація по платформах

- [Horoshop AjaxCart API](module-one-plus-one/docs/horoshop-ajax-cart.md) — кошик, події, AJAX-ендпоінти

## E2E tests

Each module has an `e2e.test.ts` file next to its `index.ts` that verifies the module mounts visibly on two real Horoshop stores (`tehnomix.com.ua` and `runabags.com.ua`) through the local site-proxy.

**What is tested:** DOM presence only — "does the module inject its element into the page?" This is a smoke-level mount check, not a behaviour or logic test.

**Where tests live:** `widget-builder/modules/module-{name}/e2e.test.ts`

**Test infrastructure:** `widget-builder/tests/e2e/` — Playwright config, global setup (builds the demo bundle before the suite), shared helpers (`siteUrl`, `findProductPath`, `waitForModuleMount`).

**How to run:**
```bash
# Make sure Docker is up and site-proxy is running:
docker compose -f docker-compose.dev.yml up -d site-proxy

# Run all module e2e tests:
task test:widgets:e2e
```

The global setup automatically swaps `demo-config.json` with a test config that enables all 10 modules, builds `demo-bundle.js` via `task build:demo`, then restores the original config. No manual bundle rebuild is needed.

**Expected outcome:** 10 modules × 2 sites = 20 test cases. `module-sms-otp-checkout` is skipped with a documented reason (requires a live checkout session with items in cart).

## Як додати новий модуль

1. Створіть папку `modules/module-{name}/`
2. Додайте файли:
   - `package.json` — `@laxarevii/module-{name}`, dep: `@laxarevii/core workspace:*`
   - `schema.ts` — Zod-схема конфігурації, експортує тип `{Name}Config`
   - `index.ts` — `export default function {name}(config): void`
3. Додайте per-site конфіг у `sites/{site}/modules/module-{name}/config.ts` та `i18n.ts`
4. Запустіть `pnpm install` для лінкування workspace-пакета
