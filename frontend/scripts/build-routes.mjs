import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:9001'

/**
 * Static marketing routes (paths only), in the order they appear in App.tsx.
 * Excludes private/utility routes (/admin, /cabinet, /onboarding, /login, /signup, etc.).
 */
export const STATIC_ROUTES = [
  '/',
  '/widgets',
  '/pricing',
  '/cases',
  '/demo',
  '/free-demo',
  '/contacts',
  '/license',
  '/offer',
  '/terms',
  '/privacy',
  '/refund',
  '/security',
]

/** Priority per path (exact match first, then pattern match). */
function getPriority(path) {
  if (path === '/') return 1.0
  if (path === '/widgets' || path === '/pricing') return 0.9
  if (path === '/cases') return 0.8
  if (path.startsWith('/widgets/') || path === '/demo' || path === '/free-demo') return 0.7
  if (path === '/contacts') return 0.5
  // legal pages
  return 0.3
}

/** Changefreq per path. */
function getChangefreq(path) {
  if (path === '/' || path === '/widgets') return 'weekly'
  if (
    path === '/pricing' ||
    path === '/cases' ||
    path === '/demo' ||
    path === '/free-demo' ||
    path.startsWith('/widgets/')
  )
    return 'monthly'
  // legal pages
  return 'yearly'
}

/**
 * Fetch widget slugs from the backend API.
 * Returns null on any failure so callers can fall back.
 * @returns {Promise<string[] | null>}
 */
async function fetchWidgetSlugsFromApi() {
  const url = `${BACKEND_URL}/api/v1/widgets`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) {
      process.stderr.write(
        `[build-routes] WARNING: GET ${url} returned HTTP ${res.status} — falling back to local slug list.\n`,
      )
      return null
    }
    const json = await res.json()
    const slugs = (json.data ?? []).map((w) => w.slug).filter(Boolean)
    if (slugs.length === 0) {
      process.stderr.write(
        `[build-routes] WARNING: API returned 0 widget slugs — falling back to local slug list.\n`,
      )
      return null
    }
    return slugs
  } catch (err) {
    process.stderr.write(
      `[build-routes] WARNING: Could not reach ${url} (${err.message}) — falling back to local slug list.\n`,
    )
    return null
  }
}

/**
 * Parse widget slugs from the local TypeScript enum file as a fallback.
 * @returns {Promise<string[]>}
 */
async function readWidgetSlugsFromFile() {
  const filePath = join(__dirname, '../src/data/widget-slugs.ts')
  const source = await readFile(filePath, 'utf-8')
  // Match lines like:  KeyName: 'some-slug',
  const slugs = []
  for (const match of source.matchAll(/:\s*'([a-z0-9-]+)'/g)) {
    slugs.push(match[1])
  }
  return slugs
}

/**
 * Returns widget slugs — tries the backend API first, then falls back to the
 * local TypeScript source file.
 * @returns {Promise<string[]>}
 */
export async function getWidgetSlugs() {
  const fromApi = await fetchWidgetSlugsFromApi()
  if (fromApi !== null) return fromApi
  return readWidgetSlugsFromFile()
}

/**
 * Returns all public sitemap routes with metadata.
 * @returns {Promise<Array<{ path: string, priority: number, changefreq: string }>>}
 */
export async function getRoutes() {
  const slugs = await getWidgetSlugs()

  const staticEntries = STATIC_ROUTES.map((path) => ({
    path,
    priority: getPriority(path),
    changefreq: getChangefreq(path),
  }))

  const widgetEntries = slugs.map((slug) => {
    const path = `/widgets/${slug}`
    return {
      path,
      priority: getPriority(path),
      changefreq: getChangefreq(path),
    }
  })

  return [...staticEntries, ...widgetEntries]
}
