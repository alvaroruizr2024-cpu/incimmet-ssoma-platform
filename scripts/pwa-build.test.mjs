import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
const script = new URL('./build-pwa.mjs', import.meta.url);
async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), 'incimmet-pwa-build-'));
  for (const sub of [
    '.next/server/app',
    '.next/static/chunks',
    '.next/static/css',
    'public/data',
    'public/icons',
    'docs',
  ])
    await mkdir(path.join(dir, sub), { recursive: true });
  await copyFile(script, path.join(dir, 'build-pwa.mjs'));
  for (const route of ['campo', 'privacidad', 'dashboard'])
    await writeFile(
      path.join(dir, '.next/server/app', `${route}.html`),
      '<html><head><link href="/_next/static/css/fixture.css" rel="stylesheet"></head><body><script src="/_next/static/chunks/fixture.js?dpl=qa-build"></script><script>self.__next_f.push(["static/chunks/campo-extra.js"])</script></body></html>',
    );
  await writeFile(path.join(dir, '.next/static/chunks/fixture.js'), '/* Synthetic QA only */');
  await writeFile(
    path.join(dir, '.next/static/chunks/campo-extra.js'),
    '/* Synthetic flight dependency */',
  );
  await writeFile(path.join(dir, '.next/static/css/fixture.css'), 'body{margin:0}');
  for (const name of [
    'data/data.json',
    'offline.html',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/maskable-512.png',
    'icons/apple-touch-icon.png',
  ])
    await writeFile(path.join(dir, 'public', name), 'QA SYNTHETIC CONTENT');
  return dir;
}
test('genera inventario con HTML y dependencias Flight, sin incluir todo el motor 3D', async () => {
  const dir = await fixture();
  try {
    execFileSync(process.execPath, ['build-pwa.mjs'], { cwd: dir });
    const js = await readFile(path.join(dir, 'public/precache-manifest.js'), 'utf8');
    assert.match(js, /\/campo/);
    assert.match(js, /\/privacidad/);
    assert.match(js, /campo-extra\.js/);
    assert.match(js, /fixture\.css/);
    assert.match(js, /"revision": "[0-9a-f]{20}"/);
    assert.doesNotMatch(js, /node_modules|three\.js/);
    const report = JSON.parse(await readFile(path.join(dir, 'docs/BUNDLE_FINAL.json'), 'utf8'));
    assert.equal(report.precached, 12);
    assert.equal(report.files.length, 2);
    assert.ok(report.files.every((r) => r.gzipBytes > 0));
    assert.ok(
      report.files.every((r) => r.initialJs.includes('/_next/static/chunks/campo-extra.js')),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('falla ante una app shell ausente; no confirma falsamente preparación offline', async () => {
  const dir = await fixture();
  try {
    await rm(path.join(dir, '.next/server/app/campo.html'));
    assert.throws(() =>
      execFileSync(process.execPath, ['build-pwa.mjs'], { cwd: dir, stdio: 'pipe' }),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
