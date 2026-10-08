/** Huella determinista de un payload JSON. Los arreglos conservan su orden. */
export function serializarEstable(valor: unknown): string {
  if (valor === null || typeof valor !== 'object') {
    const json = JSON.stringify(valor);
    if (json === undefined) throw new Error('Valor no serializable en JSON');
    return json;
  }
  if (Array.isArray(valor)) return `[${valor.map(serializarEstable).join(',')}]`;
  const objeto = valor as Record<string, unknown>;
  return `{${Object.keys(objeto)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${serializarEstable(objeto[k])}`)
    .join(',')}}`;
}
