import type { BaseNormalizada } from '../types';
import { resumenCumplimiento } from './agregaciones';
import { indicadoresOficiales } from './indicadores';
import { unicosPorId } from './filtros';

/** Selectores editoriales, no valores de indicadores ni conteos fijos. */
export const INDICADOR_NARRATIVO = { anio: 2024, ambito: 'PERU' } as const;

export function resumenPresentacion(
  base: BaseNormalizada,
  seleccion: { anio: number; ambito: string } = INDICADOR_NARRATIVO,
) {
  // La presentación siempre describe el corte importado, no nuevos cierres locales.
  const eventos = unicosPorId(base.eventos.filter((e) => e.origen === 'documental'));
  const acciones = unicosPorId(base.acciones).map((a) => ({
    ...a,
    estadoVerificado: a.estadoImportado,
  }));
  const cumplimiento = resumenCumplimiento(acciones);
  const oficiales = indicadoresOficiales(base.indicadores, seleccion.anio, seleccion.ambito);
  const fechas = eventos.flatMap((e) => (e.fecha ? [e.fecha] : [])).sort();
  const anios = eventos.map((e) => e.anio).filter(Number.isFinite);
  const proyectos = [...new Map(base.proyectos.map((p) => [p.codigo, p])).values()]
    .map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      eventos: eventos.filter((e) => e.proyectoCodigo === p.codigo).length,
    }))
    .sort((a, b) => b.eventos - a.eventos || a.codigo.localeCompare(b.codigo));
  // Una versión ambigua nunca se elige en silencio.
  const oficial = oficiales.length === 1 ? oficiales[0] : undefined;
  const sinInformacion = cumplimiento.estados['Sin información'];
  return {
    eventos: eventos.length,
    puntosEventos: eventos.map((e) => ({
      id: e.id,
      grupo: e.tipoGrupo,
      proyecto: e.proyectoCodigo,
      anio: e.anio,
    })),
    tarjetasAcciones: acciones.map((a) => ({
      id: a.id,
      cerrada: a.estadoImportado === 'Cerrada con evidencia',
      parcial: a.coberturaParcial,
    })),
    balizas: eventos
      .filter((e) => e.altoPotencial === true)
      .map((e) => ({
        id: e.id,
        proyecto: e.proyectoCodigo,
        riesgo: e.riesgoCritico ?? 'No consta',
      })),
    ciclo: [
      { titulo: 'Reporte', cantidad: eventos.length, detalle: 'registros documentales' },
      {
        titulo: 'Investigación',
        cantidad: eventos.filter((e) => e.causasInmediatas || e.causasBasicas).length,
        detalle: 'con texto causal; no acredita revisión',
      },
      { titulo: 'Acciones', cantidad: acciones.length, detalle: 'acciones vinculadas' },
      {
        titulo: 'Evidencia',
        cantidad: acciones.filter((a) => a.referenciasEvidencia.length).length,
        detalle: 'acciones con referencias, no binarios',
      },
      {
        titulo: 'Cierre',
        cantidad: cumplimiento.cerradas,
        detalle: 'según corte; revisar alcance',
      },
      {
        titulo: 'Lección',
        cantidad: unicosPorId(base.lecciones).length,
        detalle: 'lecciones catalogadas',
      },
    ],
    proyectos: proyectos.length,
    proyectosDetalle: proyectos,
    acciones: cumplimiento.total,
    lecciones: unicosPorId(base.lecciones).length,
    altoPotencial: eventos.filter((e) => e.altoPotencial === true).length,
    desde: fechas[0] ?? null,
    hasta: fechas.at(-1) ?? null,
    anioDesde: anios.length ? Math.min(...anios) : null,
    anioHasta: anios.length ? Math.max(...anios) : null,
    corte: base.meta.fecha_corte_estados,
    cerradas: cumplimiento.cerradas,
    porcentajeCierre: cumplimiento.porcentajeCierre,
    cierresParciales: cumplimiento.cierresImportadosParciales,
    sinInformacion,
    porcentajeSinInformacion: cumplimiento.total
      ? (sinInformacion / cumplimiento.total) * 100
      : null,
    advertencias: [...base.meta.advertencias],
    eventos2025: eventos.filter((e) => e.anio === 2025).length,
    indicadores: {
      anio: seleccion.anio,
      ambito: seleccion.ambito,
      ambitoNombre: oficial?.ambito_nombre ?? seleccion.ambito,
      if: oficial?.if ?? null,
      is: oficial?.is ?? null,
      ia: oficial?.ia ?? null,
      fuente: oficial?.fuente ?? null,
      versiones: oficiales.length,
    },
  };
}
export type ResumenPresentacion = ReturnType<typeof resumenPresentacion>;

/** Punto decimal requerido por el brief, sin ceros inventados para nulos. */
export function formatoNarrativo(valor: number | null | undefined, decimales = 0): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'No consta';
  const precision = Math.max(0, Math.min(6, Math.trunc(decimales)));
  return valor.toFixed(precision);
}
