import { createServer } from 'node:http';
import https from 'node:https';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { createGunzip, createBrotliDecompress, createInflate } from 'node:zlib';
import { statSync, readFileSync, existsSync, createReadStream } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

// ── Config ──────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3100;
const DEMO_BUNDLE_PATH = resolvePath(
  process.env.DEMO_BUNDLE_PATH || './public/demo-bundle.js',
);
const PUBLIC_DIR = resolvePath('./public');
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

  // Strip in-HTML security headers that could block our inline demo bundle
  // or prevent rendering inside the preview iframe.
  html = html.replace(
    /<meta[^>]+http-equiv\s*=\s*["']?(?:content-security-policy|x-frame-options)["']?[^>]*>/gi,
    '',
  );

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

// ── Demo bundle loader (mtime-cached) ──────────────────────────────
let demoBundleCache = { mtimeMs: 0, code: '', missingLogged: false };

function loadDemoBundle() {
  try {
    const stat = statSync(DEMO_BUNDLE_PATH);
    if (stat.mtimeMs !== demoBundleCache.mtimeMs) {
      const code = readFileSync(DEMO_BUNDLE_PATH, 'utf-8');
      demoBundleCache = { mtimeMs: stat.mtimeMs, code, missingLogged: false };
      console.log(`[site-proxy] loaded demo bundle (${code.length} bytes) from ${DEMO_BUNDLE_PATH}`);
    }
    return demoBundleCache.code;
  } catch (err) {
    if (!demoBundleCache.missingLogged) {
      console.warn(`[site-proxy] demo bundle not found at ${DEMO_BUNDLE_PATH}: ${err.message}`);
      demoBundleCache.missingLogged = true;
    }
    demoBundleCache.code = '';
    demoBundleCache.mtimeMs = 0;
    return '';
  }
}

function injectDemoBundle(html) {
  const code = loadDemoBundle();
  if (!code) return html;
  // Inline script — no external request, no source map, impossible to fetch
  // the raw file via DevTools Network tab. The closing </script> inside the
  // bundle would break parsing, so escape it defensively.
  const safe = code.replace(/<\/script/gi, '<\\/script');
  // Wrap in load + double-rAF so the bundle runs only after:
  //   1. The page and all site scripts have fully loaded
  //   2. The browser has completed at least one paint cycle
  // This guarantees getBoundingClientRect() returns real dimensions (not 0)
  // when the bundle mounts and measures the marquee element.
  const tag = `<script data-widgetis-demo>
console.log('[wgts] script tag executed');
window.addEventListener('load', function(){
  console.log('[wgts] load fired');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      var byId = document.getElementById('header');
      var byClass = document.querySelector('.header');
      console.log('[wgts] #header =', byId ? 'ЕСТb: ' + byId.tagName + '#' + byId.id : 'НЕТ');
      console.log('[wgts] .header =', byClass ? 'ЕСТb: ' + byClass.tagName + '.' + byClass.className : 'НЕТ');
      ${safe}
    });
  });
});
</script>`;
  return html + tag;
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
  // Intercept <a> clicks for dynamically-generated links not caught by static rewriting.
  document.addEventListener('click', function(e){
    var node = e.target;
    while (node && node.tagName !== 'A') node = node.parentElement;
    if (!node) return;
    var href = node.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href) || /^mailto:/i.test(href)) return;
    var rewritten = rewriteUrl(href);
    if (rewritten !== href) {
      e.preventDefault();
      window.location.href = rewritten;
    }
  }, true);
  // Patch history API so PJAX/SPA navigation stays within the proxy prefix.
  var nativePush = history.pushState;
  history.pushState = function(s, t, url){
    return nativePush.call(this, s, t, typeof url === 'string' ? rewriteUrl(url) : url);
  };
  var nativeReplace = history.replaceState;
  history.replaceState = function(s, t, url){
    return nativeReplace.call(this, s, t, typeof url === 'string' ? rewriteUrl(url) : url);
  };
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

// ── Wheel test page ───────────────────────────────────────────────
function buildWheelTestPage(bundle) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>Spin the Wheel — тест</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:100%;height:100%;background:#f3f4f6;font-family:system-ui,sans-serif;}
    body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;}
    .page-hint{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,.65);color:#fff;font-size:12px;padding:6px 14px;
      border-radius:9999px;pointer-events:none;white-space:nowrap;z-index:9999;}
  </style>
  <script>
    // Clear all widget state so the wheel always shows on load
    (function(){
      var keys=[];
      for(var i=0;i<localStorage.length;i++) keys.push(localStorage.key(i));
      keys.forEach(function(k){if(k&&(k.indexOf('wty_')===0||k.indexOf('wdg')===0||k.indexOf('widgetis')===0)){localStorage.removeItem(k);}});
    })();
  </script>
</head>
<body>
  <div class="page-hint">Wheel test — demo bundle</div>
  <script>${bundle}</script>
</body>
</html>`;
}

// ── Pointer variants page ─────────────────────────────────────────
function buildPointerVariantsPage() {
  const COLOR = '#ef4444';
  const W = 44; const H = 52;
  const variants = [
    {
      id: 'A',
      name: 'Класика',
      desc: 'Рівний трикутник',
      svg: `<svg width="${W}" height="${H}" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,26 2,2 22,2" fill="${COLOR}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      id: 'B',
      name: 'Гостра',
      desc: 'З вирізом (поточна)',
      svg: `<svg width="${W}" height="${H}" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,26 2,2 12,9 22,2" fill="${COLOR}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      id: 'C',
      name: 'Пін',
      desc: 'Локація-маркер',
      svg: `<svg width="${W}" height="${H}" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="10" r="9" fill="${COLOR}" stroke="white" stroke-width="1.5"/>
        <polygon points="12,26 6,16 18,16" fill="${COLOR}"/>
        <circle cx="12" cy="10" r="4" fill="rgba(255,255,255,0.35)"/>
      </svg>`,
    },
    {
      id: 'D',
      name: 'Ромб',
      desc: 'Діамантовий',
      svg: `<svg width="${W}" height="${H}" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,26 2,13 12,2 22,13" fill="${COLOR}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="12,22 6,13 12,6 18,13" fill="rgba(255,255,255,0.22)"/>
      </svg>`,
    },
    {
      id: 'E',
      name: 'Жирна V',
      desc: 'Шеврон-стрілка',
      svg: `<svg width="${W}" height="${H}" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
        <polyline points="3,4 12,24 21,4" fill="none" stroke="${COLOR}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    },
  ];

  const cards = variants.map(v => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;
      background:#fff;border-radius:16px;padding:20px 16px;
      box-shadow:0 2px 12px rgba(0,0,0,.10);min-width:100px;">
      <div style="background:#f3f4f6;border-radius:12px;padding:16px;display:flex;align-items:flex-end;justify-content:center;height:84px;width:84px;">
        <div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,.25));">${v.svg}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#111827;">${v.id}</div>
        <div style="font-size:14px;font-weight:700;color:#374151;margin-top:2px;">${v.name}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${v.desc}</div>
      </div>
    </div>`).join('');

  // ── Icon library comparison ────────────────────────────────────
  const PALETTE = ['#c026d3','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#06b6d4'];

  const libraries = [
    {
      name: 'Lucide',
      style: 'Тонкий stroke, мінімалістичний',
      url: 'lucide.dev',
      icons: [
        { label: 'Відсоток', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>` },
        { label: 'Подарунок', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>` },
        { label: 'Доставка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>` },
        { label: 'Зірка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>` },
        { label: 'Вогонь', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>` },
        { label: 'Корона', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>` },
        { label: 'Ще раз', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>` },
        { label: 'Іскри', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>` },
      ],
    },
    {
      name: 'Phosphor',
      style: 'Жирний fill, виразний, solid',
      url: 'phosphoricons.com',
      icons: [
        { label: 'Відсоток', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,61.64l-144,144a8,8,0,0,1-11.32-11.32l144-144a8,8,0,0,1,11.32,11.31ZM50.54,101.44a36,36,0,0,1,50.92-50.91h0a36,36,0,0,1-50.92,50.91ZM56,76A20,20,0,1,0,90.14,61.84h0A20,20,0,0,0,56,76ZM216,180a36,36,0,1,1-10.54-25.46h0A35.76,35.76,0,0,1,216,180Zm-16,0a20,20,0,1,0-5.86,14.14A19.87,19.87,0,0,0,200,180Z"/></svg>` },
        { label: 'Подарунок', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08a13.69,13.69,0,0,1-4.5,10c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51Zm-64.09.36A16.63,16.63,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92-9.72-1-25.44-4-34.92-12.39a13.69,13.69,0,0,1-4.5-10A16.6,16.6,0,0,1,84.87,36.87ZM40,88h80v32H40Zm16,48h64v64H56Zm144,64H136V136h64Zm16-80H136V88h80v32Z"/></svg>` },
        { label: 'Доставка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z"/></svg>` },
        { label: 'Зірка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Z"/></svg>` },
        { label: 'Вогонь', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M183.89,153.34a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68ZM216,144a88,88,0,0,1-176,0c0-27.92,11-56.47,32.66-84.85a8,8,0,0,1,11.93-.89l24.12,23.41,22-60.41a8,8,0,0,1,12.63-3.41C165.21,36,216,84.55,216,144Z"/></svg>` },
        { label: 'Корона', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M248,80a28,28,0,1,0-51.12,15.77l-26.79,33L146,73.4a28,28,0,1,0-36.06,0L85.91,128.74l-26.79-33a28,28,0,1,0-26.6,12L47,194.63A16,16,0,0,0,62.78,208H193.22A16,16,0,0,0,209,194.63l14.47-86.85A28,28,0,0,0,248,80Z"/></svg>` },
        { label: 'Ще раз', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z"/></svg>` },
        { label: 'Іскра', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor"><path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"/></svg>` },
      ],
    },
    {
      name: 'Heroicons',
      style: 'Stroke 1.5px, офіційна Tailwind CSS',
      url: 'heroicons.com',
      icons: [
        { label: 'Відсоток', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.99 14.993 6-6m6 3.001c0 1.268-.63 2.39-1.593 3.069a3.746 3.746 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043 3.745 3.745 0 0 1-3.068 1.593c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.297 3.746 3.746 0 0 1-1.593-3.068c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.297 3.745 3.745 0 0 1 3.296-1.042 3.745 3.745 0 0 1 3.068-1.594c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.297 3.746 3.746 0 0 1 1.593 3.068Z"/></svg>` },
        { label: 'Подарунок', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.625 11.505v8.25a1.5 1.5 0 0 1-1.5 1.5H4.875a1.5 1.5 0 0 1-1.5-1.5v-8.25m8.25-6.375A2.625 2.625 0 1 0 9 7.755h2.625m0-2.625v2.625m0-2.625a2.625 2.625 0 1 1 2.625 2.625h-2.625m0 0v13.5M3 11.505h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.622-.504-1.125-1.125-1.125H3c-.621 0-1.125.503-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>` },
        { label: 'Доставка', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>` },
        { label: 'Зірка', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>` },
        { label: 'Вогонь', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"/></svg>` },
        { label: 'Трофей', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"/></svg>` },
        { label: 'Ще раз', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>` },
        { label: 'Іскри', svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/></svg>` },
      ],
    },
    {
      name: 'Tabler',
      style: 'Stroke 2px, компактний, широка колекція',
      url: 'tabler.io/icons',
      icons: [
        { label: 'Відсоток', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l6 -6"/><path d="M9 9.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor"/><path d="M14 14.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>` },
        { label: 'Подарунок', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -2"/><path d="M12 8l0 13"/><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5"/></svg>` },
        { label: 'Доставка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"/></svg>` },
        { label: 'Зірка', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245"/></svg>` },
        { label: 'Вогонь', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"/></svg>` },
        { label: 'Корона', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4l4 -6"/></svg>` },
        { label: 'Ще раз', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg>` },
        { label: 'Іскри', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6"/></svg>` },
      ],
    },
    {
      name: 'Iconoir',
      style: 'Stroke 1.5px, мінімалістичний, витончений',
      url: 'iconoir.com',
      icons: [
        { label: 'Відсоток', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 19C15.8954 19 15 18.1046 15 17C15 15.8954 15.8954 15 17 15C18.1046 15 19 15.8954 19 17C19 18.1046 18.1046 19 17 19Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 9C5.89543 9 5 8.10457 5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7C9 8.10457 8.10457 9 7 9Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 5L5 19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Подарунок', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12V21.4C20 21.7314 19.7314 22 19.4 22H4.6C4.26863 22 4 21.7314 4 21.4V12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.4 7H2.6C2.26863 7 2 7.26863 2 7.6V11.4C2 11.7314 2.26863 12 2.6 12H21.4C21.7314 12 22 11.7314 22 11.4V7.6C22 7.26863 21.7314 7 21.4 7Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22V7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Доставка', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 19C8.10457 19 9 18.1046 9 17C9 15.8954 8.10457 15 7 15C5.89543 15 5 15.8954 5 17C5 18.1046 5.89543 19 7 19Z" stroke="currentColor" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 19C18.1046 19 19 18.1046 19 17C19 15.8954 18.1046 15 17 15C15.8954 15 15 15.8954 15 17C15 18.1046 15.8954 19 17 19Z" stroke="currentColor" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 17V6.6C14 6.26863 13.7314 6 13.4 6H2.6C2.26863 6 2 6.26863 2 6.6V16.4C2 16.7314 2.26863 17 2.6 17H4.65" stroke="currentColor" stroke-linecap="round"/><path d="M14 17H9.05005" stroke="currentColor" stroke-linecap="round"/><path d="M14 9H19.6101C19.8472 9 20.0621 9.13964 20.1584 9.35632L21.9483 13.3836C21.9824 13.4604 22 13.5434 22 13.6273V16.4C22 16.7314 21.7314 17 21.4 17H19.5" stroke="currentColor" stroke-linecap="round"/></svg>` },
        { label: 'Зірка', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Вогонь', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 18C8 20.4148 9.79086 21 12 21C15.7587 21 17 18.5 14.5 13.5C11 18 10.5 11 11 9C9.5 12 8 14.8177 8 18Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 21C17.0495 21 20 18.0956 20 13.125C20 8.15444 12 3 12 3C12 3 4 8.15444 4 13.125C4 18.0956 6.95054 21 12 21Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Корона', svg: `<svg width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.2 17L21 7L14.7 10L12 7L9.3 10L3 7L4.8 17H19.2Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Ще раз', svg: `<svg width="28" height="28" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.8883 13.5C21.1645 18.3113 17.013 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C16.1006 2 19.6248 4.46819 21.1679 8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { label: 'Іскри', svg: `<svg width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15C12.8747 15 15 12.949 15 8C15 12.949 17.1104 15 22 15C17.1104 15 15 17.1104 15 22C15 17.1104 12.8747 15 8 15Z" stroke="currentColor" stroke-linejoin="round"/><path d="M2 6.5C5.13376 6.5 6.5 5.18153 6.5 2C6.5 5.18153 7.85669 6.5 11 6.5C7.85669 6.5 6.5 7.85669 6.5 11C6.5 7.85669 5.13376 6.5 2 6.5Z" stroke="currentColor" stroke-linejoin="round"/></svg>` },
      ],
    },
  ];

  function libSection(lib) {
    const row = lib.icons.map((ic, i) => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
        <div style="width:56px;height:56px;border-radius:50%;background:${PALETTE[i % PALETTE.length]};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.2);color:white;">
          ${ic.svg}
        </div>
        <div style="font-size:10px;color:#6b7280;text-align:center;max-width:56px;">${ic.label}</div>
      </div>`).join('');

    return `<div style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.07);margin-bottom:14px;">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
        <span style="font-size:15px;font-weight:800;color:#111827;">${lib.name}</span>
        <span style="font-size:11px;color:#9ca3af;">${lib.url}</span>
      </div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">${lib.style}</div>
      <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;">${row}</div>
    </div>`;
  }

  const libSections = libraries.map(libSection).join('');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
  <title>Варіанти — колесо</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f3f4f6;font-family:system-ui,sans-serif;padding:20px 14px 48px;min-height:100vh;}
    h1{font-size:17px;font-weight:800;color:#111827;margin-bottom:4px;text-align:center;}
    h2{font-size:14px;font-weight:800;color:#111827;margin:22px 0 4px;text-align:center;}
    .sub{font-size:12px;color:#6b7280;text-align:center;margin-bottom:14px;}
    .divider{height:1px;background:#e5e7eb;margin:22px 0;}
    .grid-ptrs{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;}
    .badge{display:inline-block;background:#16a34a;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:9999px;margin-left:5px;vertical-align:middle;}
  </style>
</head>
<body>
  <h1>Варіанти стрілки <span class="badge">A зафіксована</span></h1>
  <p class="sub">Для довідки — поточна: Класика (A)</p>
  <div class="grid-ptrs">${cards}</div>

  <div class="divider"></div>

  <h2>Іконки з реальних бібліотек</h2>
  <p class="sub">Скажи яка бібліотека подобається — підключимо</p>
  ${libSections}
</body>
</html>`;
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

    // Route: /robots.txt — disallow all crawling on the preview origin.
    // The whole subdomain is a third-party-content sandbox; nothing here
    // should ever land in search results.
    if ((req.url || '/').split('?')[0] === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
      res.end('User-agent: *\nDisallow: /\n');
      return;
    }

    // Route: / on bare preview.widgetis.com — internal flow always uses
    // /site/{domain}/..., so a bare root request comes from a crawler or a
    // user who landed here by mistake. Redirect to the marketing site.
    if ((req.url || '/') === '/') {
      res.writeHead(301, { Location: 'https://widgetis.com/', 'Cache-Control': 'public, max-age=3600' });
      res.end();
      return;
    }

    // Route: /wheel-variants — pointer design picker
    if ((req.url || '/') === '/wheel-variants' || (req.url || '/') === '/wheel-variants/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(buildPointerVariantsPage());
      return;
    }

    // Route: /wheel-test — standalone mobile test page for the spin-the-wheel widget
    if (/^\/wheel-test\/?(\?.*)?$/.test(req.url || '/')) {
      const bundle = loadDemoBundle();
      const html = buildWheelTestPage(bundle);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }

    // Route: static files from ./public/ (e.g. /demo-unboxing.mp4)
    const staticRelPath = (req.url || '/').split('?')[0].replace(/^\/+/, '');
    if (staticRelPath) {
      const staticAbsPath = resolvePath(PUBLIC_DIR, staticRelPath);
      if (staticAbsPath.startsWith(PUBLIC_DIR + '/') && existsSync(staticAbsPath) && statSync(staticAbsPath).isFile()) {
        const ext = staticRelPath.split('.').pop()?.toLowerCase() || '';
        const mime = { mp4: 'video/mp4', webm: 'video/webm', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' };
        const contentType = mime[ext] || 'application/octet-stream';
        const { size } = statSync(staticAbsPath);
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': size, 'Cache-Control': 'public, max-age=86400', 'Accept-Ranges': 'bytes' });
        createReadStream(staticAbsPath).pipe(res);
        return;
      }
    }

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

  // Process body. HTML is cached WITHOUT the demo bundle — the bundle is
  // injected on every send (cheap string.replace) so a fresh build is
  // picked up immediately without any cache invalidation dance.
  let outBody;
  let injectDemoOnSend = false;
  if (ctLower.includes('text/html')) {
    let html = result.buffer.toString('utf-8');
    html = rewriteHtml(html, domain);
    html = injectRuntimeScript(html, domain);
    outBody = Buffer.from(html, 'utf-8');
    injectDemoOnSend = true;
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

  const finalBody = injectDemoOnSend
    ? Buffer.from(injectDemoBundle(outBody.toString('utf-8')), 'utf-8')
    : outBody;

  res.writeHead(result.statusCode, outHeaders);
  res.end(finalBody);
}

function sendCachedResponse(res, hit, visitorId, setVisitorCookie) {
  const outHeaders = {
    'Content-Type': hit.contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': `public, max-age=${Math.floor(hit.ttlMs / 1000)}`,
    'X-Proxy-Cache': 'HIT',
  };
  attachVisitorCookie(outHeaders, visitorId, setVisitorCookie);

  let body = hit.body;
  if (hit.contentType.toLowerCase().includes('text/html')) {
    body = Buffer.from(injectDemoBundle(body.toString('utf-8')), 'utf-8');
  }

  res.writeHead(200, outHeaders);
  res.end(body);
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
