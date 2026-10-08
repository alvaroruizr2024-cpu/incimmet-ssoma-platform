import { partirLineas } from '../domain/textoCanvas';
import { crearCSV, nombreArchivo } from '../domain/exportacion';
export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function descargarCSV(
  titulo: string,
  columnas: readonly string[],
  filas: readonly (readonly unknown[])[],
  notas: readonly string[] = [],
) {
  descargarBlob(
    new Blob([crearCSV(columnas, filas, notas)], { type: 'text/csv;charset=utf-8' }),
    `${nombreArchivo(titulo)}.csv`,
  );
}
export async function descargarGraficoPNG(url: string, titulo: string, notas: readonly string[]) {
  const imagen = new Image();
  imagen.src = url;
  await imagen.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1100, imagen.width);
  let ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no permite exportar el gráfico');
  ctx.font = '16px Arial';
  const textos = notas.flatMap((n) =>
    partirLineas(n, canvas.width - 56, (t) => ctx!.measureText(t).width),
  );
  canvas.height = imagen.height + 160 + textos.length * 25;
  if (canvas.height > 20000)
    throw new Error('La exportación excede el tamaño de imagen admitido; utilice CSV.');
  ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la imagen');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#151F44';
  ctx.font = 'bold 25px Arial';
  ctx.fillText(`INCIMMET · ${titulo}`, 28, 45, canvas.width - 56);
  ctx.drawImage(imagen, (canvas.width - imagen.width) / 2, 70);
  ctx.font = '16px Arial';
  textos.forEach((nota, i) => ctx!.fillText(nota, 28, imagen.height + 108 + i * 25));
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar PNG'))),
      'image/png',
    ),
  );
  descargarBlob(blob, `${nombreArchivo(titulo)}.png`);
}
