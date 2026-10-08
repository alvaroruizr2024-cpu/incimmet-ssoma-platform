import type { Indicadores, IndicadorAnualJson, ResumenSemanalJson } from '../types';
type NumeroFuente = number | null | undefined;
function noNegativo(valor: NumeroFuente): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}
function tasa(numerador: NumeroFuente, hht: NumeroFuente): number | null {
  if (!noNegativo(numerador) || !noNegativo(hht) || hht === 0) return null;
  const resultado = (numerador / hht) * 1_000_000;
  return Number.isFinite(resultado) ? resultado : null;
}
/** Numerador = accidentes Nv IV–VI de un universo y período compatibles. */
export function calcularIF(accidentesNv4a6: NumeroFuente, hht: NumeroFuente): number | null {
  return tasa(accidentesNv4a6, hht);
}
export function calcularIS(diasPerdidos: NumeroFuente, hht: NumeroFuente): number | null {
  return tasa(diasPerdidos, hht);
}
export function calcularIA(ifValor: NumeroFuente, isValor: NumeroFuente): number | null {
  if (!noNegativo(ifValor) || !noNegativo(isValor)) return null;
  const resultado = (ifValor * isValor) / 1000;
  return Number.isFinite(resultado) ? resultado : null;
}
export function calcularTRIFR(accidentesNv2a6: NumeroFuente, hht: NumeroFuente): number | null {
  return tasa(accidentesNv2a6, hht);
}
/** Devuelve todas las versiones, sin sustituirlas por cálculos ni promediarlas. */
export function indicadoresOficiales(
  indicadores: Indicadores,
  anio: number,
  ambito: string,
): IndicadorAnualJson[] {
  return indicadores.anual_por_ambito.filter((i) => i.anio === anio && i.ambito === ambito);
}
export function recalcularResumenPBIX(registro: ResumenSemanalJson) {
  return {
    if: null,
    ia: null, // Falta numerador específico Nv IV–VI en este resumen.
    is: calcularIS(registro.dias_perdidos, registro.hht),
    trifr: calcularTRIFR(registro.acc_nv2_6, registro.hht),
    etiqueta: 'Calculado del resumen PBIX — no oficial' as const,
    desde: registro.desde,
    hasta: registro.hasta,
    fuente: registro.fuente,
  };
}
