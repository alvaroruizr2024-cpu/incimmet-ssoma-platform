import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { validarDocumento } from './validarDocumento';
export const cargarDocumento = cache(async () => {
  const texto = await readFile(path.join(process.cwd(), 'public/data/data.json'), 'utf8');
  return validarDocumento(JSON.parse(texto));
});
