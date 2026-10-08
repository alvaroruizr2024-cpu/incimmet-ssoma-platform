/** Supuestos técnicos locales. No son políticas corporativas ni plazos legales. */
export const DEMO = {
  zonaHoraria: 'America/Lima',
  diasAviso: 7,
  maxArchivoBytes: 10 * 1024 * 1024,
  maxArchivos: 10,
  mimePermitidos: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  baseUrl: '/data/data.json',
  dbName: 'incimmet-ssoma-demo-v1',
} as const;
