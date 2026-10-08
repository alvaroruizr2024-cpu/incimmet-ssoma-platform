import { readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const hash = (b) => createHash('sha256').update(b).digest('hex').slice(0, 20);
const entries = new Map();
function assetsFromHtml(html) {
  return [
    ...new Set([
      ...[...html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"'?#]+)[^"']*["']/g)].map(
        (m) => m[1],
      ),
      ...[...html.matchAll(/(?:\/_next\/)?(static\/chunks\/[^"'\\\s]+\.js)/g)].map(
        (m) => `/_next/${m[1]}`,
      ),
    ]),
  ];
}
async function add(url, filename) {
  const bytes = await readFile(filename);
  entries.set(url, { url, revision: hash(bytes) });
}
// Next emits a standalone HTML shell for each of these static routes.
for (const route of ['campo', 'privacidad']) {
  const file = path.join('.next', 'server', 'app', `${route}.html`);
  const html = await readFile(file, 'utf8');
  await add(`/${route}`, file);
  for (const url of assetsFromHtml(html))
    await add(url, path.join('.next', url.replace('/_next/', '')));
}
for (const url of [
  '/data/data.json',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
])
  await add(url, `public${url}`);
await writeFile(
  'public/precache-manifest.js',
  `/* Generated from production HTML; do not edit. */\nself.__INCIMMET_PRECACHE = ${JSON.stringify([...entries.values()], null, 2)};\n`,
);
// Inventory actual emitted chunks; separate initial shell from deferred analytic / 3D chunks.
const report = {
  generated: new Date().toISOString(),
  precached: entries.size,
  method:
    'Unique JS files referenced by emitted HTML and inline Flight chunks; gzip per file. Does not replace a measured cold browser load or Lighthouse.',
  files: [],
};
for (const route of ['campo', 'dashboard']) {
  const html = await readFile(`.next/server/app/${route}.html`, 'utf8');
  const urls = assetsFromHtml(html).filter((url) => url.endsWith('.js'));
  const { gzipSync } = await import('node:zlib');
  let raw = 0,
    gzip = 0;
  for (const url of urls) {
    const b = await readFile(path.join('.next', url.replace('/_next/', '')));
    raw += b.length;
    gzip += gzipSync(b).length;
  }
  report.files.push({
    route,
    initialJs: urls,
    bytes: raw,
    gzipBytes: gzip,
    targetGzipBytes: 300 * 1024,
    withinTarget: gzip < 300 * 1024,
  });
}
await writeFile('docs/BUNDLE_FINAL.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  `PWA: ${entries.size} recursos precacheados; inventario real del bundle en docs/BUNDLE_FINAL.json.`,
);
// Next copies public assets before this manifest is generated.
if ((await stat('out').catch(() => null))?.isDirectory()) {
  await copyFile('public/precache-manifest.js', 'out/precache-manifest.js');
}
