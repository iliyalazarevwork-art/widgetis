/**
 * Playwright global setup — runs once before the entire e2e suite.
 *
 * Steps:
 *   1. Swap demo-config.json with test-config.json (all 10 modules enabled).
 *   2. Run `task build:demo` to regenerate demo-bundle.js.
 *   3. Restore original demo-config.json (via try/finally).
 *   4. Verify demo-bundle.js is non-empty.
 *   5. Verify site-proxy is reachable on http://localhost:3100.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// e2e/ → tests/ → widget-builder/ → repo root
const repoRoot = resolve(import.meta.dirname, '../../..');
const widgetBuilderDir = resolve(import.meta.dirname, '../..');
const demoConfigPath = resolve(widgetBuilderDir, 'demo-config.json');
const testConfigPath = resolve(import.meta.dirname, 'test-config.json');
const bundlePath = resolve(repoRoot, 'services/site-proxy/public/demo-bundle.js');

async function checkSiteProxy(): Promise<void> {
  const proxyUrl = 'http://localhost:3100/site/tehnomix.com.ua/';
  console.log(`[e2e setup] Checking site-proxy at ${proxyUrl} ...`);
  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10_000) });
    if (res.status !== 200) {
      throw new Error(`site-proxy returned HTTP ${res.status}`);
    }
    console.log('[e2e setup] site-proxy is reachable ✓');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[e2e setup] FATAL: site-proxy is not reachable at ${proxyUrl}\n` +
        `  Error: ${msg}\n` +
        `  Make sure Docker container 'widgetis-site-proxy-1' is running.\n` +
        `  Run: docker compose -f docker-compose.dev.yml up -d site-proxy`,
    );
  }
}

function buildDemoBundle(originalConfig: string): void {
  console.log('[e2e setup] Swapping demo-config.json with test-config.json ...');
  const testConfig = readFileSync(testConfigPath, 'utf-8');
  writeFileSync(demoConfigPath, testConfig, 'utf-8');

  try {
    console.log('[e2e setup] Running task build:demo ...');
    execSync('task build:demo', {
      cwd: repoRoot,
      stdio: 'inherit',
      timeout: 120_000,
    });
  } finally {
    console.log('[e2e setup] Restoring original demo-config.json ...');
    writeFileSync(demoConfigPath, originalConfig, 'utf-8');
  }
}

export default async function globalSetup(): Promise<void> {
  // 1. Read original config before any modification
  if (!existsSync(demoConfigPath)) {
    throw new Error(`[e2e setup] demo-config.json not found at ${demoConfigPath}`);
  }
  const originalConfig = readFileSync(demoConfigPath, 'utf-8');

  // 2. Build the bundle with all modules enabled
  buildDemoBundle(originalConfig);

  // 3. Verify bundle is non-empty
  if (!existsSync(bundlePath)) {
    throw new Error(`[e2e setup] demo-bundle.js was not written to ${bundlePath}`);
  }
  const bundleSize = statSync(bundlePath).size;
  if (bundleSize < 1024) {
    throw new Error(
      `[e2e setup] demo-bundle.js is suspiciously small (${bundleSize} bytes). Build may have failed.`,
    );
  }
  console.log(`[e2e setup] demo-bundle.js ready (${bundleSize} bytes) ✓`);

  // 4. Verify site-proxy
  await checkSiteProxy();

  console.log('[e2e setup] Global setup complete ✓');
}
