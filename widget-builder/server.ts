import { createServer, type IncomingMessage } from 'node:http';
import { networkInterfaces } from 'node:os';
import { getModuleSchemas, buildModules, type BuildRequest } from './index.js';

const PORT = Number(process.env.PORT) || 3200;
const HOST = process.env.HOST || '127.0.0.1';

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (req.method === 'GET' && req.url === '/modules') {
    try {
      const schemas = await getModuleSchemas();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(schemas, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/build-demo') {
    try {
      const body = await readBody(req);
      const { modules } = JSON.parse(body) as {
        modules: Record<string, { enabled: boolean }>
      };

      if (!modules || typeof modules !== 'object' || Object.keys(modules).length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing "modules" object' }));
        return;
      }

      const schemas = await getModuleSchemas();
      const modulesConfig: Record<string, { config: Record<string, unknown>; i18n: Record<string, unknown> }> = {};

      for (const [id, { enabled }] of Object.entries(modules)) {
        if (!enabled) continue;
        const name = id.startsWith('module-') ? id : `module-${id}`;
        const schema = schemas[name];
        if (schema?.defaultConfig && schema?.defaultI18n) {
          modulesConfig[name] = {
            config: schema.defaultConfig as Record<string, unknown>,
            i18n: schema.defaultI18n as Record<string, unknown>,
          };
        }
      }

      const skipped = Object.keys(modules).filter(id => {
        const name = id.startsWith('module-') ? id : `module-${id}`;
        return !modulesConfig[name];
      });

      if (skipped.length > 0) {
        console.log(`[build-demo] skipped unsupported modules: ${skipped.join(', ')}`);
      }

      if (Object.keys(modulesConfig).length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end('/* no supported modules */');
        return;
      }

      const js = await buildModules({ modules: modulesConfig });
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/build') {
    try {
      const body = await readBody(req);
      const request: BuildRequest = JSON.parse(body);

      if (!request.modules) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing "modules"' }));
        return;
      }

      const js = await buildModules(request);
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, HOST, () => {
  const ip = getLocalIP();
  const localHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`[widget-builder] listening on:`);
  console.log(`  Local:   http://${localHost}:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log(`  Network: http://${ip}:${PORT}`);
  }
  console.log('');
  console.log(`  GET  /modules  — JSON schemas for all modules`);
  console.log(`  POST /build      — { modules, obfuscate? } → production.js`);
  console.log(`  POST /build-demo — { modules: ["marquee", ...] } → production.js (default configs)`);
});
