/** Fechas civiles, sin desplazamientos por zona horaria del equipo del usuario. */
export function esFechaISO(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T12:00:00Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
export function exigirFechaISO(fecha: string): string {
  if (!esFechaISO(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  return fecha;
}
export function fechaLima(instante: Date = new Date()): string {
  if (!Number.isFinite(instante.getTime())) throw new Error('Instante inválido');
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  const obtener = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
}
export function instanteHastaCorte(instante: string, corte: string): boolean {
  exigirFechaISO(corte);
  // Exige zona explícita: no interpreta el timestamp en la zona del ordenador.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instante)) return false;
  const fecha = new Date(instante);
  return Number.isFinite(fecha.getTime()) && fechaLima(fecha) <= corte;
}
export function diasEntre(desde: string, hasta: string): number {
  exigirFechaISO(desde);
  exigirFechaISO(hasta);
  return Math.round(
    (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86400000,
  );
}
export function formatoFecha(fecha: string | null | undefined): string {
  if (!fecha) return 'No consta';
  if (!esFechaISO(fecha)) return fecha;
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}
