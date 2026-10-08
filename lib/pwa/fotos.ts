/** Canvas recodifica la imagen: reduce tamaño y elimina metadatos EXIF. No anonimiza rostros. */
export async function comprimirFoto(file: File): Promise<File> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 10 * 1024 * 1024 ||
    !file.size
  )
    throw new Error('Use JPEG, PNG o WebP de hasta 10 MiB.');
  let source: ImageBitmap | HTMLImageElement;
  let close = () => {};
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    close = () => bitmap.close();
  } else {
    const url = URL.createObjectURL(file),
      image = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Imagen no válida'));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    source = image;
  }
  try {
    const width = source.width,
      height = source.height;
    if (!width || !height || width * height > 80_000_000)
      throw new Error('Dimensiones de imagen no admitidas.');
    const scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('La compresión no está disponible.');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    let blob: Blob | null = null;
    for (const quality of [0.8, 0.65, 0.5]) {
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen.'))),
          'image/jpeg',
          quality,
        ),
      );
      if (blob.size <= 2 * 1024 * 1024) break;
    }
    if (!blob || blob.size > 2 * 1024 * 1024) throw new Error('La imagen comprimida supera 2 MiB.');
    // Alphabetic encoding keeps generated identifiers out of the eight-digit DNI detector.
    return new File(
      [blob],
      `foto-${crypto
        .randomUUID()
        .replace(/-/g, '')
        .replace(/[0-9a-f]/gi, (c) => String.fromCharCode(97 + parseInt(c, 16)))}.jpg`,
      { type: 'image/jpeg' },
    );
  } finally {
    close();
  }
}
