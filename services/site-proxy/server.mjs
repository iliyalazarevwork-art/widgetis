import { createServer } from 'node:http';
import https from 'node:https';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { createGunzip, createBrotliDecompress, createInflate } from 'node:zlib';

// ── Config ──────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3100;
const VISITOR_COOKIE = 'wgts_pv';
const VISITOR_TTL_MS = 60 * 60 * 1000;          // 1h
const HTML_TTL_MS = 60 * 1000;                   // 60s
const TEXT_ASSET_TTL_MS = 60 * 60 * 1000;        // 1h
const BINARY_ASSET_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX_ENTRIES = 5000;

const TEXT_EXT = new Set(['js', 'mjs', 'css', 'map', 'json']);
const BIN_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'ico', 'bmp',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp4', 'webm', 'mp3', 'ogg',
]);

// ── Persistent keep-alive agents ────────────────────────────────────
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 64,
  maxFreeSockets: 32,
  scheduling: 'fifo',
});
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 64,
  maxFreeSockets: 32,
});

// ── LRU cache (Map respects insertion order) ────────────────────────
const responseCache = new Map();

function cacheGet(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  // LRU touch
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry;
}

function cacheSet(key, body, contentType, ttlMs) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = responseCache.keys().next().value;
    if (oldest !== undefined) responseCache.delete(oldest);
  }
  responseCache.set(key, {
    body,
    contentType,
    expiresAt: Date.now() + ttlMs,
    ttlMs,
  });
}

// ── Visitor state (cookie jar + current preview domain) ────────────
const visitors = new Map(); // visitorId -> { currentDomain, jars: Map<domain, Map<name,value>>, touchedAt }

function touchVisitor(id) {
  const v = visitors.get(id);
  if (v) v.touchedAt = Date.now();
}

function getVisitor(id) {
  let v = visitors.get(id);
  if (!v) {
    v = { currentDomain: null, jars: new Map(), touchedAt: Date.now() };
    visitors.set(id, v);
  }
  return v;
}

// GC expired visitors periodically
setInterval(() => {
  const cutoff = Date.now() - VISITOR_TTL_MS;
  for (const [id, v] of visitors) {
    if (v.touchedAt < cutoff) visitors.delete(id);
  }
}, 5 * 60 * 1000).unref();

function parseVisitorCookie(req) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([A-Za-z0-9]{32})(?:;|$)`));
  return m ? m[1] : null;
}

function newVisitorId() {
  return randomBytes(16).toString('hex');
}

// ── SSRF allowlist ──────────────────────────────────────────────────
function isAllowedDomain(domain) {
  if (!domain || !domain.includes('.')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  if (/^\[/.test(domain) || /^::/.test(domain) || /^0x/i.test(domain)) return false;
  const lower = domain.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) return false;
  for (const s of ['.local', '.internal', '.test', '.invalid', '.example']) {
    if (lower.endsWith(s)) return false;
  }
  if (lower.startsWith('169.254.') || lower === 'metadata.google.internal') return false;
  return true;
}

// ── Cookie jar helpers ──────────────────────────────────────────────
function getJarCookieString(visitor, domain) {
  const jar = visitor.jars.get(domain);
  if (!jar || jar.size === 0) return '';
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeSetCookies(visitor, domain, setCookieHeaders) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return;
  let jar = visitor.jars.get(domain);
  if (!jar) {
    jar = new Map();
    visitor.jars.set(domain, jar);
  }
  for (const header of setCookieHeaders) {
    const m = /^([^=;\s]+)=([^;]*)/.exec(header);
    if (m) jar.set(m[1].trim(), m[2]);
  }
}

function mergeCookies(parts) {
  return parts.filter(Boolean).map((p) => p.trim()).filter(Boolean).join('; ');
}

// ── Upstream fetch ─────────────────────────────────────────────────
function fetchUpstream(targetUrl, { method = 'GET', headers = {}, body, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      reject(err);
      return;
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const agent = parsed.protocol === 'https:' ? httpsAgent : httpAgent;

    const finalHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: '*/*',
      'Accept-Language': 'uk,ru;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      ...headers,
    };

    if (body !== undefined && body !== null) {
      finalHeaders['Content-Length'] = Buffer.byteLength(body);
    } else {
      delete finalHeaders['Content-Length'];
    }

    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: finalHeaders,
        agent,
        timeout: 20_000,
      },
      (resp) => {
        // Follow redirects within allowed domains
        if (
          maxRedirects > 0 &&
          resp.statusCode &&
          resp.statusCode >= 300 &&
          resp.statusCode < 400 &&
          resp.headers.location
        ) {
          let loc = resp.headers.location;
          try {
            loc = new URL(loc, targetUrl).toString();
          } catch {
            resolve(buildResult(resp, Buffer.alloc(0)));
            return;
          }
          const redirectHost = new URL(loc).hostname;
          if (!isAllowedDomain(redirectHost)) {
            resolve(buildResult(resp, Buffer.alloc(0)));
            return;
          }
          resp.resume();
          fetchUpstream(loc, {
            method,
            headers,
            body,
            maxRedirects: maxRedirects - 1,
          }).then(resolve, reject);
          return;
        }

        let stream = resp;
        const enc = (resp.headers['content-encoding'] || '').toLowerCase();
        if (enc === 'gzip') stream = resp.pipe(createGunzip());
        else if (enc === 'br') stream = resp.pipe(createBrotliDecompress());
        else if (enc === 'deflate') stream = resp.pipe(createInflate());

        const chunks = [];
        stream.on('data', (c) => chunks.push(c));
        stream.on('end', () => resolve(buildResult(resp, Buffer.concat(chunks))));
        stream.on('error', reject);
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('upstream timeout'));
    });
    req.on('error', reject);

    if (body !== undefined && body !== null) req.write(body);
    req.end();
  });
}

function buildResult(resp, buffer) {
  return {
    statusCode: resp.statusCode || 200,
    contentType: resp.headers['content-type'] || 'application/octet-stream',
    cacheControl: resp.headers['cache-control'] || '',
    etag: resp.headers['etag'] || '',
    lastModified: resp.headers['last-modified'] || '',
    setCookies: resp.headers['set-cookie'] || [],
    buffer,
  };
}

// ── HTML / asset rewriting ─────────────────────────────────────────
function rewriteHtml(html, domain) {
  const prefix = `/site/${domain}`;
  const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  html = html.replace(/<base[^>]*>/gi, '');

  const absRe = new RegExp(`https?://${escaped}(/|(?=["'\`\\s>]))`, 'gi');
  html = html.replace(absRe, (_m, slash) => (slash === '/' ? `${prefix}/` : prefix));

  html = html.replace(
    /((?:href|src|action|poster|data-[\w-]+)\s*=\s*["'])\/(?!\/|site\/)/gi,
    `$1${prefix}/`,
  );
  html = html.replace(/(url\(\s*['"]?)\/(?!\/|site\/)/gi, `$1${prefix}/`);
  html = html.replace(/srcset\s*=\s*"([^"]*)"/gi, (_m, value) => {
    return `srcset="${value.replace(/(^|,\s*)\/(?!\/|site\/)/g, `$1${prefix}/`)}"`;
  });
  html = html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (_m, open, code, close) => {
    const rewritten = code.replace(
      /(["'`])(\/(?:content|frontend|assets|_widget)\/)/g,
      `$1${prefix}$2`,
    );
    return open + rewritten + close;
  });

  return html;
}

function rewriteTextAsset(body, domain) {
  const prefix = `/site/${domain}`;
  return body.replace(/(url\(\s*['"]?)\/(?!\/)/gi, `$1${prefix}/`);
}

function injectRuntimeScript(html, domain) {
  const prefix = `/site/${domain}`;
  const runtime = `<script>(function(){
  var PREFIX = ${JSON.stringify(prefix)};
  var DOMAIN = ${JSON.stringify(domain)};
  function rewriteUrl(input){
    if (typeof input !== 'string') return input;
    if (input.startsWith('//')) return input;
    if (input.startsWith(PREFIX + '/')) return input;
    if (input.startsWith('/')) return PREFIX + input;
    var abs = input.match(/^https?:\\/\\/([^\\/]+)(\\/.*)?$/i);
    if (abs && abs[1].toLowerCase() === DOMAIN.toLowerCase()) {
      return PREFIX + (abs[2] || '/');
    }
    return input;
  }
  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function(input, init){
      if (typeof input === 'string') input = rewriteUrl(input);
      else if (input && input.url) input = new Request(rewriteUrl(input.url), input);
      return nativeFetch.call(this, input, init);
    };
  }
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    if (typeof url === 'string') url = rewriteUrl(url);
    return nativeOpen.apply(this, [method, url].concat([].slice.call(arguments, 2)));
  };
  document.addEventListener('submit', function(e){
    var form = e.target;
    if (!form || !form.action) return;
    form.action = rewriteUrl(form.action);
  }, true);
})();</script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, runtime + '</body>');
  }
  return html + runtime;
}

// ── Blocked / cloudflare fallback ──────────────────────────────────
function blockedHtml(domain, status, isCloudflare) {
  const reason = isCloudflare ? 'cloudflare' : 'blocked';
  const message = isCloudflare
    ? 'This site is protected and blocks loading through proxy.'
    : `The target site returned HTTP ${status}.`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f9fa;font-family:system-ui,-apple-system,sans-serif;color:#64748b;text-align:center;padding:32px;}
.wrap{max-width:360px;}
.icon{font-size:48px;margin-bottom:16px;}
h2{font-size:18px;font-weight:700;color:#1e293b;margin-bottom:8px;}
p{font-size:14px;line-height:1.6;}
</style></head><body><div class="wrap"><div class="icon">!</div><h2>Preview unavailable</h2><p>${message} Try another domain.</p></div>
<script>window.parent.postMessage({type:'site-proxy-error',reason:'${reason}',domain:'${domain}'},'*')</script>
</body></html>`;
}

// ── Path helpers ───────────────────────────────────────────────────
function classifyCacheForGet(targetPath) {
  const q = targetPath.indexOf('?');
  const pathOnly = q === -1 ? targetPath : targetPath.slice(0, q);
  const dot = pathOnly.lastIndexOf('.');
  const slash = pathOnly.lastIndexOf('/');
  const ext = dot > slash ? pathOnly.slice(dot + 1).toLowerCase() : '';
  if (BIN_EXT.has(ext)) return { ttlMs: BINARY_ASSET_TTL_MS };
  if (TEXT_EXT.has(ext)) return { ttlMs: TEXT_ASSET_TTL_MS };
  if (ext === '' || ext === 'html' || ext === 'htm') return { ttlMs: HTML_TTL_MS };
  return null;
}

function normalizeSetCookie(cookie, domain) {
  let out = cookie.replace(/;\s*domain=[^;]*/gi, '').replace(/;\s*secure/gi, '');
  if (/;\s*path=[^;]*/i.test(out)) {
    out = out.replace(/;\s*path=[^;]*/gi, `; Path=/site/${domain}/`);
  } else {
    out += `; Path=/site/${domain}/`;
  }
  if (/;\s*samesite=[^;]*/i.test(out)) {
    out = out.replace(/;\s*samesite=[^;]*/gi, '; SameSite=Lax');
  } else {
    out += '; SameSite=Lax';
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── Main request handler ───────────────────────────────────────────
async function handle(req, res) {
  try {
    // Visitor cookie (plain, not encrypted)
    let visitorId = parseVisitorCookie(req);
    let setVisitorCookie = false;
    if (!visitorId) {
      visitorId = newVisitorId();
      setVisitorCookie = true;
    }
    const visitor = getVisitor(visitorId);
    touchVisitor(visitorId);

    // Route: /site/{domain}/{path?} — explicit domain
    const siteMatch = /^\/site\/([^/]+)(\/.*)?$/.exec(req.url || '/');
    if (siteMatch) {
      const domain = decodeURIComponent(siteMatch[1]);
      if (!isAllowedDomain(domain)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Domain not allowed' }));
        return;
      }
      visitor.currentDomain = domain;
      const targetPath = siteMatch[2] || '/';
      return await proxyTo(req, res, visitor, visitorId, setVisitorCookie, domain, targetPath);
    }

    // Route: /{prefix}/... or /{locale}/{prefix}/... — implicit (current domain)
    const domain = visitor.currentDomain;
    if (!domain || !isAllowedDomain(domain)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Preview domain not set' }));
      return;
    }
    return await proxyTo(req, res, visitor, visitorId, setVisitorCookie, domain, req.url || '/');
  } catch (err) {
    console.error('[site-proxy] handler error:', err);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy error');
    } else {
      res.end();
    }
  }
}

async function proxyTo(req, res, visitor, visitorId, setVisitorCookie, domain, targetPath) {
  const targetUrl = `https://${domain}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
  const method = (req.method || 'GET').toUpperCase();

  // Fast path: cache hit for idempotent GETs
  let cacheKey = null;
  let cacheTtlMs = 0;
  if (method === 'GET') {
    const cat = classifyCacheForGet(targetPath);
    if (cat) {
      cacheKey = `${domain}|${targetPath}`;
      cacheTtlMs = cat.ttlMs;
      const hit = cacheGet(cacheKey);
      if (hit) {
        sendCachedResponse(res, hit, visitorId, setVisitorCookie);
        return;
      }
    }
  }

  // Build upstream request headers
  const headers = {};
  const jarCookie = getJarCookieString(visitor, domain);
  const browserCookie = stripVisitorCookie(req.headers.cookie || '');
  const mergedCookie = mergeCookies([jarCookie, browserCookie]);
  if (mergedCookie) headers.Cookie = mergedCookie;

  if (method !== 'GET' && method !== 'HEAD') {
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    if (req.headers['x-requested-with']) headers['X-Requested-With'] = req.headers['x-requested-with'];
    if (req.headers['x-csrf-token']) headers['X-CSRF-Token'] = req.headers['x-csrf-token'];
    headers.Referer = `https://${domain}/`;
    headers.Origin = `https://${domain}`;
  }

  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(req);
  }

  let result;
  try {
    result = await fetchUpstream(targetUrl, { method, headers, body });
  } catch (err) {
    console.error('[site-proxy] upstream error:', targetUrl, err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Upstream error');
    return;
  }

  if (result.setCookies.length) storeSetCookies(visitor, domain, result.setCookies);

  const ctLower = result.contentType.toLowerCase();
  const isHtml = ctLower.includes('text/html');

  // Horoshop challenge: capture hash cookie and retry once
  if (isHtml && method === 'GET') {
    const bodyStr = result.buffer.toString('utf-8');
    if (
      bodyStr.includes('challenge_passed') &&
      bodyStr.includes('location.reload')
    ) {
      const m = /defaultHash\s*=\s*"([0-9a-f]+)"/i.exec(bodyStr);
      if (m) {
        let jar = visitor.jars.get(domain);
        if (!jar) {
          jar = new Map();
          visitor.jars.set(domain, jar);
        }
        jar.set('challenge_passed', m[1]);
        try {
          const retry = await fetchUpstream(targetUrl, {
            method: 'GET',
            headers: { Cookie: getJarCookieString(visitor, domain) },
          });
          if (retry.setCookies.length) storeSetCookies(visitor, domain, retry.setCookies);
          result = retry;
        } catch {
          // fall through with original result
        }
      }
    }
  }

  // Cloudflare / blocked
  if (result.statusCode === 403 || result.statusCode === 503) {
    const bodyStr = result.buffer.toString('utf-8').toLowerCase();
    const isCf = bodyStr.includes('just a moment') || bodyStr.includes('cf-mitigated');
    const html = blockedHtml(domain, result.statusCode, isCf);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(html);
    return;
  }

  // Process body
  let outBody;
  if (ctLower.includes('text/html')) {
    let html = result.buffer.toString('utf-8');
    html = rewriteHtml(html, domain);
    html = injectRuntimeScript(html, domain);
    outBody = Buffer.from(html, 'utf-8');
  } else if (ctLower.includes('text/css') || ctLower.includes('javascript')) {
    const text = result.buffer.toString('utf-8');
    outBody = Buffer.from(rewriteTextAsset(text, domain), 'utf-8');
  } else {
    outBody = result.buffer;
  }

  // Store in cache. Set-Cookie is intentionally NOT stored in cache entries,
  // so cached HTML responses are served without upstream session cookies.
  // For a read-only iframe preview of a public shop this is the correct
  // tradeoff: dozens of viewers share one cached HTML body.
  const hasSetCookie = result.setCookies && result.setCookies.length > 0;
  if (cacheKey && cacheTtlMs > 0 && result.statusCode === 200) {
    cacheSet(cacheKey, outBody, result.contentType, cacheTtlMs);
  }

  // Send
  const outHeaders = {
    'Content-Type': result.contentType,
    'Access-Control-Allow-Origin': '*',
  };
  if (cacheKey && cacheTtlMs > 0) {
    outHeaders['Cache-Control'] = `public, max-age=${Math.floor(cacheTtlMs / 1000)}`;
  } else if (result.cacheControl) {
    outHeaders['Cache-Control'] = result.cacheControl;
  }
  if (result.etag) outHeaders['ETag'] = result.etag;
  if (result.lastModified) outHeaders['Last-Modified'] = result.lastModified;

  if (hasSetCookie) {
    outHeaders['Set-Cookie'] = result.setCookies.map((c) => normalizeSetCookie(c, domain));
  }
  attachVisitorCookie(outHeaders, visitorId, setVisitorCookie);

  res.writeHead(result.statusCode, outHeaders);
  res.end(outBody);
}

function sendCachedResponse(res, hit, visitorId, setVisitorCookie) {
  const outHeaders = {
    'Content-Type': hit.contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': `public, max-age=${Math.floor(hit.ttlMs / 1000)}`,
    'X-Proxy-Cache': 'HIT',
  };
  attachVisitorCookie(outHeaders, visitorId, setVisitorCookie);
  res.writeHead(200, outHeaders);
  res.end(hit.body);
}

function attachVisitorCookie(outHeaders, visitorId, force) {
  if (!force) return;
  const cookie = `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=${Math.floor(VISITOR_TTL_MS / 1000)}; HttpOnly; SameSite=Lax`;
  const existing = outHeaders['Set-Cookie'];
  if (Array.isArray(existing)) existing.push(cookie);
  else if (existing) outHeaders['Set-Cookie'] = [existing, cookie];
  else outHeaders['Set-Cookie'] = [cookie];
}

function stripVisitorCookie(raw) {
  if (!raw) return '';
  return raw
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith(`${VISITOR_COOKIE}=`))
    .join('; ');
}

// ── Start ──────────────────────────────────────────────────────────
const server = createServer(handle);
server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;
server.listen(PORT, () => {
  console.log(`[site-proxy] listening on http://0.0.0.0:${PORT}`);
});
