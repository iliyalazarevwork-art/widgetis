import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

function printHelp() {
  console.log(`Mobile visual check

Usage:
  node mobile-visual-check.mjs --baseline-url <url> --candidate-url <url> [options]

Required:
  --baseline-url <url>         Reference URL (usually local page).
  --candidate-url <url>        URL to compare against the baseline.

Options:
  --name <id>                  Report name. Default: home
  --out-dir <path>             Output directory. Default: ./results
  --width <px>                 Viewport width. Default: 390
  --height <px>                Viewport height. Default: 844
  --wait-ms <ms>               Extra wait before screenshot. Default: 1200
  --max-diff-percent <num>     Allowed difference percent. Default: 1
  --full-page                  Capture full page screenshot
  --baseline-selector <css>    Screenshot only this element on baseline page
  --candidate-selector <css>   Screenshot only this element on candidate page
  --help                       Show help

Exit codes:
  0  Difference is within threshold
  2  Difference exceeds threshold
  1  Runtime error
`);
}

function parseArgs(argv) {
  const args = {
    name: 'home',
    outDir: './results',
    width: 390,
    height: 844,
    waitMs: 1200,
    maxDiffPercent: 1,
    fullPage: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];

    if (key === '--help') {
      args.help = true;
      continue;
    }

    if (key === '--full-page') {
      args.fullPage = true;
      continue;
    }

    if (!key.startsWith('--')) {
      throw new Error(`Unknown argument: ${key}`);
    }

    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }

    const field = key.slice(2);
    i += 1;

    if (field === 'baseline-url') args.baselineUrl = next;
    else if (field === 'candidate-url') args.candidateUrl = next;
    else if (field === 'name') args.name = next;
    else if (field === 'out-dir') args.outDir = next;
    else if (field === 'width') args.width = Number(next);
    else if (field === 'height') args.height = Number(next);
    else if (field === 'wait-ms') args.waitMs = Number(next);
    else if (field === 'max-diff-percent') args.maxDiffPercent = Number(next);
    else if (field === 'baseline-selector') args.baselineSelector = next;
    else if (field === 'candidate-selector') args.candidateSelector = next;
    else throw new Error(`Unknown argument: --${field}`);
  }

  return args;
}

async function readPng(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function cropToSharedSize(img, width, height) {
  const output = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    const srcStart = y * img.width * 4;
    const srcEnd = srcStart + width * 4;
    const dstStart = y * width * 4;
    img.data.copy(output.data, dstStart, srcStart, srcEnd);
  }

  return output;
}

async function capture({
  url,
  filePath,
  width,
  height,
  waitMs,
  fullPage,
  selector,
}) {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 2,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // Some pages keep network connections open indefinitely.
    }

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
      `,
    });

    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }

    await page.evaluate(() => window.scrollTo(0, 0));

    if (selector) {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 10000 });
      await element.screenshot({ path: filePath });
    } else {
      await page.screenshot({ path: filePath, fullPage });
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.baselineUrl || !args.candidateUrl) {
    printHelp();
    throw new Error('Both --baseline-url and --candidate-url are required.');
  }

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const baselinePngPath = path.join(outDir, `${args.name}-baseline.png`);
  const candidatePngPath = path.join(outDir, `${args.name}-candidate.png`);
  const diffPngPath = path.join(outDir, `${args.name}-diff.png`);
  const reportPath = path.join(outDir, `${args.name}-report.json`);

  await capture({
    url: args.baselineUrl,
    filePath: baselinePngPath,
    width: args.width,
    height: args.height,
    waitMs: args.waitMs,
    fullPage: args.fullPage,
    selector: args.baselineSelector,
  });

  await capture({
    url: args.candidateUrl,
    filePath: candidatePngPath,
    width: args.width,
    height: args.height,
    waitMs: args.waitMs,
    fullPage: args.fullPage,
    selector: args.candidateSelector,
  });

  const baselineRaw = await readPng(baselinePngPath);
  const candidateRaw = await readPng(candidatePngPath);

  const width = Math.min(baselineRaw.width, candidateRaw.width);
  const height = Math.min(baselineRaw.height, candidateRaw.height);

  const baseline = cropToSharedSize(baselineRaw, width, height);
  const candidate = cropToSharedSize(candidateRaw, width, height);
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    baseline.data,
    candidate.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: true,
      alpha: 0.5,
    },
  );

  fs.writeFileSync(diffPngPath, PNG.sync.write(diff));

  const comparedPixels = width * height;
  const diffPercent = (diffPixels / comparedPixels) * 100;
  const passed = diffPercent <= args.maxDiffPercent;

  const report = {
    timestamp: new Date().toISOString(),
    baselineUrl: args.baselineUrl,
    candidateUrl: args.candidateUrl,
    comparedImage: { width, height },
    sourceImageSizes: {
      baseline: { width: baselineRaw.width, height: baselineRaw.height },
      candidate: { width: candidateRaw.width, height: candidateRaw.height },
    },
    diffPixels,
    comparedPixels,
    diffPercent,
    maxDiffPercent: args.maxDiffPercent,
    passed,
    files: {
      baseline: baselinePngPath,
      candidate: candidatePngPath,
      diff: diffPngPath,
    },
  };

  writeJson(reportPath, report);

  console.log(`Baseline:  ${baselinePngPath}`);
  console.log(`Candidate: ${candidatePngPath}`);
  console.log(`Diff:      ${diffPngPath}`);
  console.log(`Report:    ${reportPath}`);
  console.log(`Difference: ${diffPercent.toFixed(4)}% (${diffPixels}/${comparedPixels})`);
  console.log(`Threshold:  ${args.maxDiffPercent.toFixed(4)}%`);
  console.log(`Result:     ${passed ? 'PASS' : 'FAIL'}`);

  if (!passed) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
