/** RFC 4180 quoting plus formula neutralization for spreadsheet consumers. */
export function celdaCSV(valor: unknown): string {
  let texto =
    valor === null || valor === undefined
      ? 'No consta'
      : Array.isArray(valor)
        ? valor.join(' | ')
        : String(valor);
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(texto) && typeof valor !== 'number') texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}
export function crearCSV(
  columnas: readonly string[],
  filas: readonly (readonly unknown[])[],
  notas: readonly string[] = [],
): string {
  const contexto = notas.map((n) => [n, ...columnas.slice(1).map(() => '')]);
  return (
    '\ufeff' + [...contexto, columnas, ...filas].map((f) => f.map(celdaCSV).join(',')).join('\r\n')
  );
}
export function nombreArchivo(texto: string) {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100) || 'incimmet'
  );
}
