import type { LeccionLectura } from '../types';
import { partirLineas } from '../domain/textoCanvas';
import { formatoFecha } from '../domain/fechas';
import { filasDifusion } from '../domain/lecciones';
import { descargarBlob } from './descargas';
/** Dibujo propio en canvas. No depende de servicios externos ni transmite el texto de la lección. */
export async function generarFichaDifusion(l: LeccionLectura, corte: string): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  let ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible para generar la ficha');
  const ancho = 1264,
    izquierda = 88,
    tamaño = 28,
    interlineado = 42;
  const partir = (texto: string) => partirLineas(texto, ancho, (t) => ctx!.measureText(t).width);
  ctx.font = `${tamaño}px Arial`;
  const filas = filasDifusion(l).map((f) => ({ ...f, lineas: partir(f.texto) }));
  ctx.font = 'bold 30px Arial';
  const titulo = partir(l.riesgoCritico);
  canvas.height =
    410 + titulo.length * 48 + filas.reduce((n, f) => n + 90 + f.lineas.length * interlineado, 0);
  // Si el contenido crece, dividir en láminas; nunca recortar silenciosamente la fuente.
  if (canvas.height > 24000)
    throw new Error(
      'La lección excede el tamaño admitido para una sola ficha PNG; no se recortó el contenido.',
    );
  ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la ficha');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#151F44';
  ctx.fillRect(0, 0, canvas.width, 230 + titulo.length * 48);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('INCIMMET', izquierda, 82);
  ctx.font = '24px Arial';
  ctx.fillStyle = '#9CDCF5';
  ctx.fillText('Hagamos el camino juntos · Charla de 5 minutos', izquierda, 124);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial';
  titulo.forEach((line, i) => ctx!.fillText(line, izquierda, 190 + i * 48));
  let y = 280 + titulo.length * 48;
  ctx.fillStyle = '#475569';
  ctx.font = '24px Arial';
  ctx.fillText(`${l.id} · Catalogada · Corte documental ${formatoFecha(corte)}`, izquierda, y);
  y += 65;
  for (const f of filas) {
    ctx.fillStyle = '#0070C0';
    ctx.font = 'bold 25px Arial';
    ctx.fillText(f.titulo, izquierda, y);
    y += 45;
    ctx.fillStyle = '#0F172A';
    ctx.font = `${tamaño}px Arial`;
    for (const line of f.lineas) {
      ctx.fillText(line, izquierda, y);
      y += interlineado;
    }
    y += 45;
  }
  ctx.font = '22px Arial';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    'Ficha de difusión de demo. Generarla no acredita lectura, capacitación ni cierre de acciones.',
    izquierda,
    y + 10,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar el archivo PNG'))),
      'image/png',
    ),
  );
  descargarBlob(blob, `INCIMMET_${l.id}_difusion.png`);
}
