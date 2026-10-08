import type { AccionLectura, EventoLectura, Filtros, LeccionLectura } from '../types';
import { exigirFechaISO } from './fechas';
export function textoBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .trim();
}
export function unicosPorId<T extends { id: string }>(filas: readonly T[]): T[] {
  return [...new Map(filas.map((f) => [f.id, f])).values()];
}
function coincide<T>(valor: T, opciones: readonly T[] | undefined): boolean {
  return !opciones?.length || opciones.includes(valor);
}
function dentro(fecha: string | null | undefined, desde?: string, hasta?: string): boolean {
  if (desde) exigirFechaISO(desde);
  if (hasta) exigirFechaISO(hasta);
  if (!desde && !hasta) return true;
  return Boolean(fecha && (!desde || fecha >= desde) && (!hasta || fecha <= hasta));
}
export function filtrarEventos(
  eventos: readonly EventoLectura[],
  f: Filtros = {},
): EventoLectura[] {
  const q = textoBusqueda(f.busqueda ?? '');
  return unicosPorId(eventos).filter(
    (e) =>
      coincide(e.anio, f.anios) &&
      coincide(e.mes, f.meses) &&
      coincide(e.proyectoCodigo, f.proyectos) &&
      coincide(e.cliente, f.clientes) &&
      coincide(e.tipo, f.tipos) &&
      coincide(e.tipoGrupo, f.grupos) &&
      coincide(e.riesgoCritico ?? null, f.riesgos) &&
      coincide(e.actividad ?? null, f.actividades) &&
      coincide(e.equipo ?? null, f.equipos) &&
      coincide(e.nivelIncimmet ?? null, f.niveles) &&
      coincide(e.pgIncimmet ?? null, f.potenciales) &&
      (f.altoPotencial === undefined || e.altoPotencial === f.altoPotencial) &&
      coincide(e.empresaTipo, f.empresas) &&
      coincide(e.id, f.eventoIds) &&
      dentro(e.fecha, f.desde, f.hasta) &&
      (!q ||
        textoBusqueda(
          [e.id, e.descripcion, e.actividad, e.equipo, e.riesgoCritico, ...e.fuentes].join(' '),
        ).includes(q)),
  );
}
function coincideAccion(a: AccionLectura, f: Filtros): boolean {
  return (
    coincide(a.estadoVerificado, f.estadosAccion) &&
    coincide(a.jerarquia, f.jerarquias) &&
    coincide(a.responsableRol, f.responsables) &&
    dentro(a.fechaCompromiso, f.compromisoDesde, f.compromisoHasta)
  );
}
/** Año/mes filtran el evento de origen; compromiso tiene filtros diferentes. */
export function filtrarAcciones(
  acciones: readonly AccionLectura[],
  eventos: readonly EventoLectura[],
  f: Filtros = {},
): AccionLectura[] {
  const ids = new Set(filtrarEventos(eventos, f).map((e) => e.id));
  return unicosPorId(acciones).filter((a) => ids.has(a.eventoId) && coincideAccion(a, f));
}
export function filtrarLecciones(
  lecciones: readonly LeccionLectura[],
  eventos: readonly EventoLectura[],
  filtro: Filtros = {},
  busquedaLecciones = '',
): LeccionLectura[] {
  const ids = new Set(filtrarEventos(eventos, filtro).map((e) => e.id));
  const q = textoBusqueda(busquedaLecciones);
  return unicosPorId(lecciones).filter(
    (l) =>
      l.eventoIds.some((id) => ids.has(id)) &&
      (!q ||
        textoBusqueda(
          [
            l.id,
            l.quePaso,
            l.porQue,
            l.leccion,
            l.riesgoCritico,
            l.actividadCritica,
            l.aplicabilidad,
            ...Object.values(l.controles),
          ].join(' '),
        ).includes(q)),
  );
}
/** Cohorte de cumplimiento anterior al filtro por estado: evita el falso 100%. */
export function seleccionarCruzado(
  eventos: readonly EventoLectura[],
  acciones: readonly AccionLectura[],
  lecciones: readonly LeccionLectura[],
  f: Filtros = {},
) {
  const sinEstado = { ...f, estadosAccion: undefined };
  const cohorteAcciones = filtrarAcciones(acciones, eventos, sinEstado);
  const seleccionAcciones = filtrarAcciones(acciones, eventos, f);
  const restringeAcciones = Boolean(
    f.estadosAccion?.length ||
    f.jerarquias?.length ||
    f.responsables?.length ||
    f.compromisoDesde ||
    f.compromisoHasta,
  );
  const ids = new Set(seleccionAcciones.map((a) => a.eventoId));
  const seleccionEventos = filtrarEventos(eventos, f).filter(
    (e) => !restringeAcciones || ids.has(e.id),
  );
  const leccionesSeleccionadas = filtrarLecciones(lecciones, seleccionEventos);
  return {
    eventos: seleccionEventos,
    acciones: seleccionAcciones,
    lecciones: leccionesSeleccionadas,
    cohorteAcciones,
  };
}
/** Memoización de una entrada. Los consumidores no deben mutar entradas/salidas. */
export function crearSelectorMemoizado() {
  let anteriores: readonly unknown[] | undefined;
  let resultado: ReturnType<typeof seleccionarCruzado> | undefined;
  return (
    eventos: readonly EventoLectura[],
    acciones: readonly AccionLectura[],
    lecciones: readonly LeccionLectura[],
    filtros: Filtros,
  ) => {
    const firma = JSON.stringify(filtros);
    const claves = [eventos, acciones, lecciones, firma];
    if (anteriores?.every((v, i) => v === claves[i]) && resultado) return resultado;
    anteriores = claves;
    resultado = seleccionarCruzado(eventos, acciones, lecciones, filtros);
    return resultado;
  };
}
