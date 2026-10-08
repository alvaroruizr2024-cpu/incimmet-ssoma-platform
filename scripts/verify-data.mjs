import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const bytes = await readFile(new URL('public/data/data.json', root));
const manifest = JSON.parse(await readFile(new URL('docs/data-integrity.json', root), 'utf8'));
const sha = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha, manifest.sha256, 'El JSON cambió respecto del archivo recibido');
assert.equal(bytes.length, manifest.bytes);
const d = JSON.parse(bytes.toString('utf8'));
for (const [key, n] of Object.entries(d.meta.conteos)) {
  assert.equal(d[key].length, n);
  assert.equal(n, manifest.conteos[key]);
}
for (const name of ['eventos', 'acciones', 'lecciones'])
  assert.equal(new Set(d[name].map((x) => x.id)).size, d[name].length);
assert.equal(new Set(d.proyectos.map((x) => x.codigo)).size, d.proyectos.length);
assert.equal(new Set(d.documentos_fuente.map((x) => x.codigo)).size, d.documentos_fuente.length);
for (const event of d.eventos) {
  assert.ok(d.proyectos.some((p) => p.codigo === event.proyecto));
  assert.equal(event.n_acciones, d.acciones.filter((a) => a.evento_id === event.id).length);
  for (const id of event.lecciones)
    assert.ok(d.lecciones.some((l) => l.id === id && l.eventos.includes(event.id)));
}
for (const action of d.acciones)
  assert.ok(d.eventos.some((e) => e.id === action.evento_id && e.proyecto === action.proyecto));
for (const l of d.lecciones)
  for (const id of l.eventos)
    assert.ok(d.eventos.some((e) => e.id === id && e.lecciones.includes(l.id)));
for (const p of d.proyectos) {
  const eventos = d.eventos.filter((e) => e.proyecto === p.codigo);
  assert.equal(p.n_eventos, eventos.length);
  assert.deepEqual(
    [...p.anios_con_eventos].sort(),
    [...new Set(eventos.map((e) => e.anio))].sort(),
  );
}
console.log(`JSON original íntegro: ${bytes.length} bytes; SHA-256 ${sha}`);
console.log(`Conteos e integridad referencial verificados: ${JSON.stringify(d.meta.conteos)}`);
