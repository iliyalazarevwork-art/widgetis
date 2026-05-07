/**
 * prerender.mjs
 *
 * Post-build script: boot a static file server over dist/, open every public
 * marketing route in a headless Chromium browser, wait for react-helmet-async
 * to commit the final <title> and <meta name="description">, then write the
 * serialised HTML back to dist/ so search engines get fully-rendered pages.
 *
 * Usage:
 *   node scripts/prerender.mjs
 *
 * Env vars:
 *   BACKEND_URL          — real backend for /api/* proxy (default: warn + skip proxy)
 *   PRERENDER_CONCURRENCY — parallel Playwright pages (default: 4)
 */

import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { readFile, writeFile, mkdir, rename, access } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { getRoutes } from './build-routes.mjs'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FRONTEND_ROOT = join(__dirname, '..')
const DIST_DIR = join(FRONTEND_ROOT, 'dist')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BACKEND_URL = process.env.BACKEND_URL ?? null
const CONCURRENCY = Math.max(1, parseInt(process.env.PRERENDER_CONCURRENCY ?? '4', 10))
const HELMET_TIMEOUT_MS = 10_000
const HELMET_POLL_INTERVAL_MS = 150

if (!BACKEND_URL) {
  process.stderr.write(
    '[prerender] WARNING: BACKEND_URL is not set — /api/* requests will fail during prerender.\n' +
      '           Prerendered pages may be missing dynamic content.\n' +
      '           Set BACKEND_URL=https://api.widgetis.com (or your staging URL) to fix this.\n',
  )
}

// ---------------------------------------------------------------------------
// MIME types for the static file server
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
}

// ---------------------------------------------------------------------------
// Find a free TCP port
// ---------------------------------------------------------------------------

/** @returns {Promise<number>} */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (srv.address())
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Reverse-proxy helper: pipe a single /api/* request to BACKEND_URL
// ---------------------------------------------------------------------------

/**
 * Proxy `req` → `BACKEND_URL + req.url`, write response back through `res`.
 * Returns a Promise that resolves when the proxy response is fully flushed.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} backendUrl
 */
function proxyRequest(req, res, backendUrl) {
  return new Promise((resolve) => {
    const target = new URL(req.url, backendUrl)
    const isHttps = target.protocol === 'https:'
    const transport = isHttps ? httpsRequest : httpRequest

    const options = {
      hostname: target.hostname,
      port: target.port || (isHttps ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
      },
    }

    const proxyReq = transport(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
      proxyRes.on('end', resolve)
      proxyRes.on('error', () => resolve())
    })

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end('Bad Gateway: backend unreachable')
      }
      resolve()
    })

    req.pipe(proxyReq, { end: true })
  })
}

// ---------------------------------------------------------------------------
// Static file server with SPA fallback + /api/* proxy
// ---------------------------------------------------------------------------

/**
 * @param {string} distDir
 * @param {number} port
 * @param {string | null} backendUrl
 * @returns {Promise<import('node:http').Server>}
 */
async function bootStaticServer(distDir, port, backendUrl) {
  const indexHtml = await readFile(join(distDir, 'index.html'))

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`)
      const pathname = url.pathname

      // ── /api/* proxy ────────────────────────────────────────────────────
      if (pathname.startsWith('/api/')) {
        if (!backendUrl) {
          res.writeHead(503, { 'Content-Type': 'text/plain' })
          res.end('No BACKEND_URL configured')
          return
        }
        await proxyRequest(req, res, backendUrl)
        return
      }

      // ── Static files ─────────────────────────────────────────────────────
      // Strip leading slash and prevent path traversal
      const relative = pathname.replace(/^\//, '').replace(/\.\./g, '')
      const filePath = join(distDir, relative)

      let fileBuffer
      try {
        fileBuffer = await readFile(filePath)
        // If it's a directory path without trailing slash, try index.html inside
        if (!extname(relative)) {
          throw new Error('directory — try index.html')
        }
      } catch {
        // Try <path>/index.html for routes without extensions
        try {
          fileBuffer = await readFile(join(filePath, 'index.html'))
          res.writeHead(200, { 'Content-Type': MIME['.html'] })
          res.end(fileBuffer)
          return
        } catch {
          // SPA fallback → always serve index.html
          res.writeHead(200, { 'Content-Type': MIME['.html'] })
          res.end(indexHtml)
          return
        }
      }

      const ext = extname(filePath).toLowerCase()
      const mime = MIME[ext] ?? 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': mime })
      res.end(fileBuffer)
    } catch (err) {
      process.stderr.write(`[prerender] server error: ${err.message}\n`)
      if (!res.headersSent) {
        res.writeHead(500)
        res.end('Internal server error')
      }
    }
  })

  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve())
    server.on('error', reject)
  })

  return server
}

// ---------------------------------------------------------------------------
// Wait for Helmet to commit <title> + <meta name="description">
// ---------------------------------------------------------------------------

/**
 * Poll the page until both <title> (non-empty) and
 * <meta name="description"> are present, or until the timeout fires.
 *
 * @param {import('playwright').Page} page
 * @param {number} timeoutMs
 * @returns {Promise<boolean>} true if ready before timeout
 */
async function waitForHelmet(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const title = document.title
      const desc = document.querySelector('meta[name="description"]')
      return title.length > 0 && desc !== null && desc.getAttribute('content')?.length > 0
    })
    if (ready) return true
    await new Promise((r) => setTimeout(r, HELMET_POLL_INTERVAL_MS))
  }
  return false
}

// ---------------------------------------------------------------------------
// Route → output file path
// ---------------------------------------------------------------------------

/**
 * Map a route path to the output file path inside dist/.
 *   /           → dist/index.html
 *   /widgets    → dist/widgets/index.html
 *   /widgets/x  → dist/widgets/x/index.html
 *
 * @param {string} distDir
 * @param {string} routePath
 * @returns {{ outputPath: string, isSpaShell: boolean }}
 */
function routeToOutputPath(distDir, routePath) {
  const isSpaShell = routePath === '/'
  const outputPath = isSpaShell
    ? join(distDir, 'index.html')
    : join(distDir, ...routePath.replace(/^\//, '').split('/'), 'index.html')
  return { outputPath, isSpaShell }
}

// ---------------------------------------------------------------------------
// Sanity-check rendered HTML
// ---------------------------------------------------------------------------

/**
 * Returns true only if the HTML contains both a <title> and a
 * <meta name="description" ...> with non-empty content.
 *
 * @param {string} html
 * @returns {boolean}
 */
function isValidHtml(html) {
  if (!html || html.length < 100) return false
  const hasDoctype = /<!doctype\s+html/i.test(html)
  const hasTitle = /<title>[^<]+<\/title>/i.test(html)
  const hasDesc = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)
  return hasDoctype && hasTitle && hasDesc
}

// ---------------------------------------------------------------------------
// Prerender a single route
// ---------------------------------------------------------------------------

/**
 * @param {import('playwright').Browser} browser
 * @param {string} baseUrl
 * @param {{ path: string }} route
 * @param {string} distDir
 * @returns {Promise<{ ok: boolean, ms: number, kb: number, warning?: string }>}
 */
async function prerenderRoute(browser, baseUrl, route, distDir) {
  const start = Date.now()
  const page = await browser.newPage()

  try {
    // Suppress noisy console messages from the app
    page.on('console', () => {})
    page.on('pageerror', () => {})

    const url = `${baseUrl}${route.path}`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

    const helmetReady = await waitForHelmet(page, HELMET_TIMEOUT_MS)
    if (!helmetReady) {
      process.stderr.write(
        `[prerender] WARNING: title/description never resolved for ${route.path} after ${HELMET_TIMEOUT_MS}ms\n`,
      )
    }

    const html = await page.content()
    const ms = Date.now() - start

    if (!isValidHtml(html)) {
      return {
        ok: false,
        ms,
        kb: 0,
        warning: 'HTML failed sanity check (missing <title> or <meta name="description">)',
      }
    }

    const { outputPath, isSpaShell } = routeToOutputPath(distDir, route.path)

    await mkdir(dirname(outputPath), { recursive: true })

    if (isSpaShell) {
      // Atomic write: write to a temp file first, then rename to avoid
      // trashing the SPA shell if something goes wrong mid-write.
      const tmpPath = `${outputPath}.prerender.tmp`
      await writeFile(tmpPath, html, 'utf-8')
      await rename(tmpPath, outputPath)
    } else {
      await writeFile(outputPath, html, 'utf-8')
    }

    const kb = Math.round(html.length / 1024)
    return { ok: true, ms, kb }
  } finally {
    await page.close()
  }
}

// ---------------------------------------------------------------------------
// Concurrency pool helper
// ---------------------------------------------------------------------------

/**
 * Run `tasks` with at most `concurrency` items in flight at once.
 * Each task is a zero-arg async function.
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks
 * @param {number} concurrency
 * @returns {Promise<T[]>}
 */
async function pool(tasks, concurrency) {
  const results = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= tasks.length) break
      results[i] = await tasks[i]()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

/** @type {import('node:http').Server | null} */
let _server = null
/** @type {import('playwright').Browser | null} */
let _browser = null

async function cleanup() {
  if (_browser) {
    try {
      await _browser.close()
    } catch {
      // ignore
    }
    _browser = null
  }
  if (_server) {
    await new Promise((resolve) => _server.close(() => resolve()))
    _server = null
  }
}

process.on('SIGINT', async () => {
  process.stderr.write('\n[prerender] Interrupted — cleaning up…\n')
  await cleanup()
  process.exit(130)
})

process.on('SIGTERM', async () => {
  process.stderr.write('[prerender] Terminated — cleaning up…\n')
  await cleanup()
  process.exit(143)
})

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Verify dist/ exists
  try {
    await access(DIST_DIR)
  } catch {
    process.stderr.write(
      `[prerender] FATAL: dist/ not found at ${DIST_DIR}\n` +
        '           Run `npm run build` (without prerender) first.\n',
    )
    process.exit(1)
  }

  // 2. Verify dist/index.html exists
  try {
    await access(join(DIST_DIR, 'index.html'))
  } catch {
    process.stderr.write(
      '[prerender] FATAL: dist/index.html not found — vite build may have failed.\n',
    )
    process.exit(1)
  }

  // 3. Collect routes
  process.stdout.write('[prerender] Collecting routes…\n')
  const routes = await getRoutes()
  process.stdout.write(`[prerender] Found ${routes.length} routes.\n`)

  // 4. Boot static server
  const port = await findFreePort()
  const baseUrl = `http://127.0.0.1:${port}`

  _server = await bootStaticServer(DIST_DIR, port, BACKEND_URL)
  process.stdout.write(`[prerender] Static server on ${baseUrl} (proxy → ${BACKEND_URL ?? 'none'})\n`)

  // 5. Launch browser
  let browser
  try {
    browser = await chromium.launch({ headless: true })
  } catch (err) {
    if (err.message?.includes('Executable') || err.message?.includes('browser')) {
      process.stderr.write(
        '[prerender] FATAL: Chromium browser not found.\n' +
          '           Run `npx playwright install chromium` first.\n',
      )
    } else {
      process.stderr.write(`[prerender] FATAL: Could not launch browser: ${err.message}\n`)
    }
    await cleanup()
    process.exit(1)
  }
  _browser = browser

  // 6. Prerender each route
  const globalStart = Date.now()
  let successCount = 0
  let failCount = 0

  /**
   * @param {{ path: string }} route
   * @returns {() => Promise<void>}
   */
  const makeTask = (route) => async () => {
    let result
    try {
      result = await prerenderRoute(browser, baseUrl, route, DIST_DIR)
    } catch (err) {
      process.stdout.write(`✗ ${route.path} — uncaught error: ${err.message}\n`)
      failCount++
      return
    }

    if (result.ok) {
      process.stdout.write(`✓ ${route.path} (${result.ms}ms, ${result.kb}KB)\n`)
      successCount++
    } else {
      process.stdout.write(`✗ ${route.path} — ${result.warning}\n`)
      failCount++
    }
  }

  const tasks = routes.map(makeTask)
  await pool(tasks, CONCURRENCY)

  // 7. Summary
  const totalMs = Date.now() - globalStart
  const totalS = (totalMs / 1000).toFixed(1)
  const total = routes.length
  process.stdout.write(
    `\nPrerendered ${successCount}/${total} routes in ${totalS}s` +
      (failCount > 0 ? ` (${failCount} failed — see warnings above)` : '') +
      '\n',
  )

  // 8. Cleanup
  await cleanup()

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch(async (err) => {
  process.stderr.write(`[prerender] FATAL: ${err.message}\n${err.stack ?? ''}\n`)
  await cleanup()
  process.exit(1)
})
