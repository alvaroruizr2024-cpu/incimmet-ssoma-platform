import type { AccionLectura, BaseNormalizada, EventoLectura, Filtros } from '../types';
import { resumenCumplimiento, sumaConCobertura } from './agregaciones';
import { declaracionCerrada } from './estadoVerificado';
import { unicosPorId } from './filtros';

export function avisosCalidad(base: BaseNormalizada): string[] {
  const recuperados = base.eventos.filter((e) => e.anio === 2025).length;
  const parciales = base.acciones
    .filter((a) => a.estadoImportado === 'Cerrada con evidencia' && a.coberturaParcial)
    .map((a) => a.id);
  return [
    ...base.meta.advertencias,
    `2025 contiene ${recuperados} registros recuperados; cobertura no exhaustiva.`,
    ...(parciales.length
      ? [`${parciales.join(', ')}: cierres importados con evidencia de alcance parcial.`]
      : []),
  ];
}
export function resumenKPIs(eventos: readonly EventoLectura[], cohorte: readonly AccionLectura[]) {
  const filas = unicosPorId(eventos);
  const accidentes = filas.filter((e) => e.tipoGrupo === 'Accidente');
  const orden = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
  const porNivel = contarEventos(accidentes, 'nivelIncimmet').sort(
    (a, b) => orden.indexOf(a.etiqueta) - orden.indexOf(b.etiqueta),
  );
  return {
    eventos: filas.length,
    accidentes: accidentes.length,
    porNivel,
    hpri: filas.filter((e) => e.altoPotencial === true).length,
    potencialDesconocido: filas.filter((e) => e.altoPotencial === null).length,
    diasPerdidos: sumaConCobertura(filas, 'diasPerdidos'),
    cumplimiento: resumenCumplimiento(cohorte),
  };
}
export type DimensionConteo =
  | 'proyectoCodigo'
  | 'tipoGrupo'
  | 'tipo'
  | 'riesgoCritico'
  | 'actividad'
  | 'equipo'
  | 'nivelIncimmet'
  | 'pgIncimmet';
export function contarEventos(eventos: readonly EventoLectura[], campo: DimensionConteo) {
  const grupos = new Map<string | null, string[]>();
  for (const e of unicosPorId(eventos)) {
    const clave = e[campo] ?? null;
    grupos.set(clave, [...(grupos.get(clave) ?? []), e.id]);
  }
  return [...grupos]
    .map(([clave, eventoIds]) => ({
      clave,
      etiqueta: clave ?? 'No consta',
      cantidad: eventoIds.length,
      eventoIds,
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}
export function matrizSeveridad(eventos: readonly EventoLectura[]) {
  const e = unicosPorId(eventos);
  const niveles = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
  const filas = niveles.flatMap((nivel) =>
    niveles.map((potencial) => {
      const ids = e
        .filter(
          (v) =>
            (v.nivelIncimmet ?? 'No consta') === nivel &&
            (v.pgIncimmet ?? 'No consta') === potencial,
        )
        .map((v) => v.id);
      return { nivel, potencial, cantidad: ids.length || null, eventoIds: ids };
    }),
  );
  const completos = e.filter((v) => v.nivelIncimmet != null && v.pgIncimmet != null).length;
  return { niveles, filas, completos, faltantes: e.length - completos };
}
export function coberturaAnual(
  eventos: readonly EventoLectura[],
  proyectos: readonly string[],
  anios?: readonly number[],
) {
  const e = unicosPorId(eventos);
  const reales = e.map((v) => v.anio);
  const years = anios
    ? [...new Set(anios)].sort((a, b) => a - b)
    : reales.length
      ? Array.from(
          { length: Math.max(...reales) - Math.min(...reales) + 1 },
          (_, i) => Math.min(...reales) + i,
        )
      : [];
  return proyectos.flatMap((proyecto) =>
    years.map((anio) => {
      const ids = e
        .filter((v) => v.proyectoCodigo === proyecto && v.anio === anio)
        .map((v) => v.id);
      return { proyecto, anio, cantidad: ids.length || null, eventoIds: ids };
    }),
  );
}
export function cumplimientoComparado(
  acciones: readonly AccionLectura[],
  proyectos: readonly string[] = [],
) {
  const filas = unicosPorId(acciones);
  return [...new Set([...proyectos, ...filas.map((a) => a.proyectoCodigo)])]
    .sort()
    .map((proyecto) => {
      const seleccion = filas.filter((a) => a.proyectoCodigo === proyecto);
      const resumen = resumenCumplimiento(seleccion);
      const declaradas = seleccion.filter((a) => declaracionCerrada(a.estadoDeclarado)).length;
      return {
        proyecto,
        ...resumen,
        declaradas,
        porcentajeDeclarado: resumen.total ? (declaradas / resumen.total) * 100 : null,
      };
    });
}
export type EntidadCalidad = 'eventos' | 'acciones' | 'lecciones' | 'proyectos';
function aplanar(objeto: Record<string, unknown>, prefijo = ''): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(objeto).flatMap(([key, value]) => {
      const nombre = prefijo + key;
      return value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(aplanar(value as Record<string, unknown>, `${nombre}.`))
        : [[nombre, value]];
    }),
  );
}
/** Cada ausencia ocupa una única categoría; un array vacío no es un null. */
export function calidadCampos(base: BaseNormalizada, entidad: EntidadCalidad) {
  const rows: { valores: Record<string, unknown>; eventos: string[] }[] =
    entidad === 'eventos'
      ? base.eventos
          .filter((e) => e.original)
          .map((e) => ({
            valores: aplanar(e.original as unknown as Record<string, unknown>),
            eventos: [e.id],
          }))
      : entidad === 'acciones'
        ? base.acciones.map((a) => ({
            valores: aplanar(a.original as unknown as Record<string, unknown>),
            eventos: [a.eventoId],
          }))
        : entidad === 'lecciones'
          ? base.lecciones.map((l) => ({
              valores: aplanar(l.original as unknown as Record<string, unknown>),
              eventos: l.eventoIds,
            }))
          : base.proyectos.map((p) => ({
              valores: aplanar(p as unknown as Record<string, unknown>),
              eventos: base.eventos.filter((e) => e.proyectoCodigo === p.codigo).map((e) => e.id),
            }));
  const campos = [...new Set(rows.flatMap((r) => Object.keys(r.valores)))];
  return campos
    .map((campo) => {
      let nulos = 0,
        vacios = 0,
        noConsta = 0,
        ausentes = 0;
      const ids = new Set<string>();
      const idsNulos = new Set<string>();
      for (const r of rows) {
        const valor = r.valores[campo];
        let falta = true;
        if (!(campo in r.valores)) ausentes++;
        else if (valor === null) {
          nulos++;
          r.eventos.forEach((id) => idsNulos.add(id));
        } else if (
          (Array.isArray(valor) && !valor.length) ||
          (typeof valor === 'string' && !valor.trim())
        )
          vacios++;
        else if (typeof valor === 'string' && /^no consta\b/i.test(valor.trim())) noConsta++;
        else falta = false;
        if (falta) r.eventos.forEach((id) => ids.add(id));
      }
      return {
        campo,
        total: rows.length,
        nulos,
        vacios,
        noConsta,
        ausentes,
        porcentajeNulos: rows.length ? (nulos / rows.length) * 100 : null,
        porcentajeAusencia: rows.length
          ? ((nulos + vacios + noConsta + ausentes) / rows.length) * 100
          : null,
        eventoIds: [...ids],
        eventoIdsNulos: [...idsNulos],
      };
    })
    .sort(
      (a, b) =>
        (b.porcentajeNulos ?? 0) - (a.porcentajeNulos ?? 0) || a.campo.localeCompare(b.campo),
    );
}
/** One mark selects a tuple atomically; a second click on the same tuple clears it. */
export function seleccionarMarca(actual: Filtros, marca: Partial<Filtros>): Filtros {
  const entradas = Object.entries(marca).filter(([, v]) => v !== undefined);
  const igual =
    entradas.length > 0 &&
    entradas.every(([k, v]) => JSON.stringify(actual[k as keyof Filtros]) === JSON.stringify(v));
  const resultado: Filtros = { ...actual };
  for (const [k, v] of entradas) {
    if (igual) delete resultado[k as keyof Filtros];
    else Object.assign(resultado, { [k]: v });
  }
  return resultado;
}
export function eventHref(id: string) {
  return id.startsWith('LOCAL-')
    ? `/eventos/local?id=${encodeURIComponent(id)}`
    : `/eventos/${encodeURIComponent(id)}`;
}
