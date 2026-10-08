/** Wraps text using measured width. Long tokens are split; no source is silently truncated. */
export function partirLineas(
  texto: string,
  ancho: number,
  medir: (texto: string) => number,
): string[] {
  if (!Number.isFinite(ancho) || ancho <= 0) throw new Error('Ancho de texto inválido');
  const lineas: string[] = [];
  for (const parrafo of texto.split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const candidata = linea ? `${linea} ${palabra}` : palabra;
      if (medir(candidata) <= ancho) {
        linea = candidata;
        continue;
      }
      if (linea) {
        lineas.push(linea);
        linea = '';
      }
      for (const letra of palabra) {
        if (linea && medir(linea + letra) > ancho) {
          lineas.push(linea);
          linea = '';
        }
        linea += letra;
      }
    }
    if (linea) lineas.push(linea);
    else if (!parrafo.trim()) lineas.push('');
  }
  return lineas.length ? lineas : ['No consta'];
}
