#!/usr/bin/env node
/**
 * Screenshot utility — opens a URL in a headless browser and saves a screenshot.
 * Supports Playwright's built-in device emulation for realistic mobile rendering.
 *
 * Usage:
 *   node screenshot.mjs <url> [options]
 *
 * Options:
 *   -o, --output <path>        Output file path (default: screenshot.png)
 *   -w, --width <px>           Viewport width  (default: 1440)
 *   -h, --height <px>          Viewport height (default: 900)
 *   -r, --resolution <WxH>     Shortcut for width x height, e.g. 1920x1080
 *   -d, --device-scale <n>     Device scale factor / DPR (default: 1)
 *   -m, --mobile               Enable mobile emulation (isMobile, hasTouch)
 *   --device <name>            Use a Playwright built-in device preset
 *   --list-devices             List available device presets
 *   -f, --full-page            Capture full scrollable page (default: false)
 *   --delay <ms>               Wait ms after load before screenshot (default: 0)
 *   --wait-for <selector>      Wait for a CSS selector to appear before screenshot
 *
 * Examples:
 *   node screenshot.mjs http://127.0.0.1:5173/
 *   node screenshot.mjs http://127.0.0.1:5173/ --device "iPhone 14 Pro Max"
 *   node screenshot.mjs http://127.0.0.1:5173/ --device "Galaxy S21"
 *   node screenshot.mjs http://127.0.0.1:5173/ -r 375x812 -d 3 -m -o mobile.png
 *   node screenshot.mjs --list-devices
 */

import { chromium, devices } from "playwright";
import { parseArgs } from "node:util";
import path from "node:path";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    output:         { type: "string",  short: "o", default: "screenshot.png" },
    width:          { type: "string",  short: "w", default: "1440" },
    height:         { type: "string",  short: "h", default: "900" },
    resolution:     { type: "string",  short: "r" },
    "device-scale": { type: "string",  short: "d", default: "1" },
    mobile:         { type: "boolean", short: "m", default: false },
    device:         { type: "string" },
    "list-devices": { type: "boolean", default: false },
    "full-page":    { type: "boolean", short: "f", default: false },
    delay:          { type: "string",  default: "0" },
    "wait-for":     { type: "string" },
  },
});

// List devices mode
if (values["list-devices"]) {
  const mobile = Object.keys(devices).filter(
    (name) => devices[name].isMobile && !name.includes("landscape")
  );
  console.log("Available mobile devices:\n");
  for (const name of mobile) {
    const d = devices[name];
    console.log(`  ${name.padEnd(35)} ${d.viewport.width}x${d.viewport.height} @${d.deviceScaleFactor}x`);
  }
  process.exit(0);
}

const url = positionals[0];
if (!url) {
  console.error("Usage: node screenshot.mjs <url> [options]");
  process.exit(1);
}

let contextOptions;

if (values.device) {
  // Use built-in device preset
  const preset = devices[values.device];
  if (!preset) {
    console.error(`Unknown device: "${values.device}"`);
    console.error("Run with --list-devices to see available devices.");
    process.exit(1);
  }
  contextOptions = { ...preset };
  console.log(`Capturing ${url}`);
  console.log(`  Device: ${values.device}`);
  console.log(`  Viewport: ${preset.viewport.width}x${preset.viewport.height} @${preset.deviceScaleFactor}x`);
  console.log(`  Mobile: ${preset.isMobile}, Touch: ${preset.hasTouch}`);
} else {
  // Manual configuration
  let width = parseInt(values.width, 10);
  let height = parseInt(values.height, 10);

  if (values.resolution) {
    const parts = values.resolution.split("x");
    if (parts.length !== 2) {
      console.error("Resolution must be in WxH format, e.g. 1920x1080");
      process.exit(1);
    }
    width = parseInt(parts[0], 10);
    height = parseInt(parts[1], 10);
  }

  const deviceScaleFactor = parseFloat(values["device-scale"]);
  const isMobile = values.mobile;

  contextOptions = {
    viewport: { width, height },
    deviceScaleFactor,
    isMobile,
    hasTouch: isMobile,
  };

  console.log(`Capturing ${url}`);
  console.log(`  Viewport: ${width}x${height} @${deviceScaleFactor}x`);
  console.log(`  Mobile: ${isMobile}`);
}

const fullPage = values["full-page"];
const delay = parseInt(values.delay, 10);
const waitFor = values["wait-for"];
const output = values.output;

console.log(`  Full page: ${fullPage}`);
console.log(`  Output: ${path.resolve(output)}`);

const browser = await chromium.launch();
const context = await browser.newContext(contextOptions);
const page = await context.newPage();

await page.goto(url, { waitUntil: "networkidle" });

if (waitFor) {
  console.log(`  Waiting for selector: ${waitFor}`);
  await page.waitForSelector(waitFor, { timeout: 15000 });
}

if (delay > 0) {
  console.log(`  Waiting ${delay}ms...`);
  await new Promise((r) => setTimeout(r, delay));
}

await page.screenshot({ path: output, fullPage });
await browser.close();

console.log("Done!");
