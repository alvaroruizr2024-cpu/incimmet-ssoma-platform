import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const bytes = readFileSync('package-lock.json');
const lock = JSON.parse(bytes);
for (const field of ['dependencies', 'devDependencies']) {
  const wanted = pkg[field] ?? {},
    got = lock.packages[''][field] ?? {};
  if (JSON.stringify(Object.entries(wanted).sort()) !== JSON.stringify(Object.entries(got).sort()))
    throw new Error(`Lock no coincide: ${field}`);
}
for (const [key, value] of Object.entries(pkg.overrides ?? {}))
  if (String(value).startsWith('$') && !pkg.dependencies?.[String(value).slice(1)])
    throw new Error(`Override no resoluble: ${key}`);
if (Object.keys(pkg.overrides ?? {}).some((k) => k.startsWith('picomatch@')))
  throw new Error('Overrides picomatch no admitidos');
console.log(
  'package-lock.json real compatible con las dependencias directas. SHA-256:',
  createHash('sha256').update(bytes).digest('hex'),
);
