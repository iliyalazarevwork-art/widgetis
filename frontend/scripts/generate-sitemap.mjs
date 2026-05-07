import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { getRoutes } from './build-routes.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_URL = 'https://widgetis.com'
const TODAY = new Date().toISOString().slice(0, 10)

/** Build a pretty-printed XML sitemap string from a list of route objects. */
function buildXml(routes) {
  const urlEntries = routes
    .map(({ path, priority, changefreq }) => {
      const loc = `${BASE_URL}${path}`
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${TODAY}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n')
}

/** Write the sitemap to a file, creating the directory if needed. */
async function writeSitemap(filePath, xml) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, xml, 'utf-8')
}

async function main() {
  process.stdout.write('[generate-sitemap] Collecting routes…\n')

  const routes = await getRoutes()
  const xml = buildXml(routes)

  const frontendRoot = join(__dirname, '..')
  const distPath = join(frontendRoot, 'dist', 'sitemap.xml')
  const publicPath = join(frontendRoot, 'public', 'sitemap.xml')

  await Promise.all([writeSitemap(distPath, xml), writeSitemap(publicPath, xml)])

  process.stdout.write(
    `[generate-sitemap] Done — ${routes.length} URLs written to:\n` +
      `  ${distPath}\n` +
      `  ${publicPath}\n`,
  )
}

main().catch((err) => {
  process.stderr.write(`[generate-sitemap] FATAL: ${err.message}\n`)
  process.exit(1)
})
