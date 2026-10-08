import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('out');
const portArg = process.argv.indexOf('--port');
const port = Number(portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || 3100);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};
export const server = http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const requested = decodeURIComponent(url.pathname);
      const filename = path.resolve(root, `.${requested}`);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        res.writeHead(400).end();
        return;
      }
      let selected;
      for (const candidate of [filename, `${filename}.html`, path.join(filename, 'index.html')]) {
        if ((await stat(candidate).catch(() => null))?.isFile()) {
          selected = candidate;
          break;
        }
      }
      const status = selected ? 200 : 404;
      selected ??= path.join(root, '404.html');
      const bytes = await readFile(selected);
      res.writeHead(status, {
        'Content-Type': mime[path.extname(selected)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          requested === '/campo'
            ? 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()'
            : 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
        'Content-Security-Policy':
          requested === '/sw.js'
            ? "default-src 'self'; script-src 'self' https://storage.googleapis.com/workbox-cdn/releases/7.3.0/; connect-src 'self' https://storage.googleapis.com; object-src 'none'"
            : "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self' blob:; media-src 'self' blob:; connect-src 'self'",
        'Cache-Control':
          requested === '/sw.js' || requested === '/precache-manifest.js' ? 'no-cache' : 'no-store',
      });
      res.end(bytes);
    } catch {
      res.writeHead(500).end('No se pudo servir el recurso.');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`INCIMMET: http://127.0.0.1:${port}`));
