import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const directas = { ...manifest.dependencies, ...manifest.devDependencies };
let invalid = false;
const fallo = (message) => {
  invalid = true;
  console.error(message);
};
for (const [name, version] of Object.entries(directas)) {
  if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(version)) {
    fallo(`Versión directa no fijada: ${name} ${version}`);
  }
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function ejecutar(args) {
  const result = spawnSync(npm, args, {
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    fallo(`No se pudo verificar npm ${args.join(' ')}. Ejecute npm install y revise el árbol.`);
    console.error(result.error?.message ?? result.stderr);
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    fallo(`npm ${args.join(' ')} no devolvió JSON válido.`);
    return null;
  }
}
const tree = ejecutar(['ls', '--all', '--json']);
if (tree)
  for (const [name, version] of Object.entries(directas)) {
    if (tree.dependencies?.[name]?.version !== version)
      fallo(`La versión instalada de ${name} no coincide con ${version}.`);
  }
// --long reports physical locations. Repeated deduplicated references to the same
// path are not separate installations; two versions OR two locations are rejected.
for (const pkg of ['react', 'three', 'playwright-core']) {
  const subtree = ejecutar(['ls', pkg, '--all', '--json', '--long']);
  if (!subtree) continue;
  const ubicaciones = new Set();
  const versiones = new Set();
  const visitar = (node) => {
    for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
      if (name === pkg) {
        if (dependency.version) versiones.add(dependency.version);
        const location = dependency.path;
        if (location && fs.existsSync(location)) ubicaciones.add(fs.realpathSync(location));
      }
      visitar(dependency);
    }
  };
  visitar(subtree);
  const directPath = path.resolve('node_modules', pkg);
  if (fs.existsSync(directPath)) ubicaciones.add(fs.realpathSync(directPath));
  if (versiones.size !== 1 || ubicaciones.size !== 1)
    fallo(
      `${pkg}: se requiere una sola instalación. Versiones: ${[...versiones].join(', ') || 'ausente'}; rutas: ${[...ubicaciones].join(', ') || 'ausente'}`,
    );
  else console.log(`${pkg}: instalación única ${[...versiones][0]}`);
}
console.log(
  invalid
    ? 'Dependencias NO verificadas.'
    : 'Versiones fijadas y árbol sin conflictos ni duplicados de React, Three y Playwright core.',
);
process.exitCode = invalid ? 1 : 0;
