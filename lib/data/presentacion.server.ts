import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizarDocumento } from './normalizar';
import { validarDocumento } from './validarDocumento';
import { resumenPresentacion } from '../domain/presentacion';

/** Adaptador de lectura documental para SSG. Solo envía el resumen al cliente, no el JSON completo. */
export async function cargarPresentacion() {
  const texto = await readFile(path.join(process.cwd(), 'public/data/data.json'), 'utf8');
  return resumenPresentacion(normalizarDocumento(validarDocumento(JSON.parse(texto))));
}
