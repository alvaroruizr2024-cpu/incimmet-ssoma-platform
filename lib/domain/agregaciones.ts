import type { AccionLectura, EventoLectura, EstadoVerificado } from '../types';
import { ESTADOS_VERIFICADOS } from './estadoVerificado';
import { textoBusqueda, unicosPorId } from './filtros';
export type DimensionPareto =
  | 'tipo'
  | 'tipoGrupo'
  | 'riesgoCritico'
  | 'actividad'
  | 'equipo'
  | 'causasInmediatas'
  | 'causasBasicas';
export function esNoConsta(valor: unknown): boolean {
  return (
    valor === null ||
    valor === undefined ||
    (typeof valor === 'string' && (!valor.trim() || /^no consta\b/.test(textoBusqueda(valor))))
  );
}
export function pareto(eventos: readonly EventoLectura[], dimension: DimensionPareto) {
  const grupos = new Map<string, string[]>();
  const unicos = unicosPorId(eventos);
  let sinDato = 0;
  for (const e of unicos) {
    const valor = e[dimension];
    if (esNoConsta(valor)) {
      sinDato++;
      continue;
    }
    const categoria = valor as string;
    grupos.set(categoria, [...(grupos.get(categoria) ?? []), e.id]);
  }
  const conDato = unicos.length - sinDato;
  let acumulado = 0;
  const filas = [...grupos]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'))
    .map(([categoria, eventoIds]) => {
      acumulado += eventoIds.length;
      return {
        categoria,
        cantidad: eventoIds.length,
        porcentaje: (eventoIds.length / conDato) * 100,
        porcentajeAcumulado: (acumulado / conDato) * 100,
        eventoIds,
        contieneInferencia: /inferid[oa]/i.test(categoria),
      };
    });
  return {
    filas,
    total: unicos.length,
    conDato,
    sinDato,
    denominadorPorcentaje: 'Registros con dato en la dimensión',
  };
}
export function mapaCalorProyectoMes(
  eventos: readonly EventoLectura[],
  anios: readonly number[],
  proyectos: readonly string[],
) {
  const unicos = unicosPorId(eventos).filter(
    (e) => anios.includes(e.anio) && proyectos.includes(e.proyectoCodigo),
  );
  const grupos = new Map<string, string[]>();
  for (const e of unicos) {
    if (e.mes === null) continue;
    const clave = `${e.proyectoCodigo}|${e.anio}-${String(e.mes).padStart(2, '0')}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), e.id]);
  }
  const periodos = [...new Set(anios)]
    .sort((a, b) => a - b)
    .flatMap((a) => Array.from({ length: 12 }, (_, m) => `${a}-${String(m + 1).padStart(2, '0')}`));
  const filas = [...new Set(proyectos)].flatMap((proyecto) =>
    periodos.map((periodo) => {
      const eventoIds = grupos.get(`${proyecto}|${periodo}`) ?? [];
      return {
        proyecto,
        periodo,
        cantidad: eventoIds.length || null,
        eventoIds,
        cobertura: eventoIds.length ? 'Con registros documentados' : 'Sin registros en esta base',
      };
    }),
  );
  return { filas, periodos, sinMes: unicos.filter((e) => e.mes === null).map((e) => e.id) };
}
export function tendencias(
  eventos: readonly EventoLectura[],
  frecuencia: 'anual' | 'mensual' = 'mensual',
) {
  const unicos = unicosPorId(eventos);
  const grupos = new Map<string, { ids: string[]; porGrupo: Record<string, number> }>();
  const sinMes: string[] = [];
  for (const e of unicos) {
    if (frecuencia === 'mensual' && e.mes === null) {
      sinMes.push(e.id);
      continue;
    }
    const periodo =
      frecuencia === 'anual' ? String(e.anio) : `${e.anio}-${String(e.mes).padStart(2, '0')}`;
    const g = grupos.get(periodo) ?? { ids: [], porGrupo: {} };
    g.ids.push(e.id);
    g.porGrupo[e.tipoGrupo] = (g.porGrupo[e.tipoGrupo] ?? 0) + 1;
    grupos.set(periodo, g);
  }
  // Se incluyen los huecos del intervalo para no unir años/meses sin cobertura.
  const anios = unicos.map((e) => e.anio);
  const periodos: string[] = [];
  if (anios.length)
    for (let a = Math.min(...anios); a <= Math.max(...anios); a++) {
      if (frecuencia === 'anual') periodos.push(String(a));
      else for (let m = 1; m <= 12; m++) periodos.push(`${a}-${String(m).padStart(2, '0')}`);
    }
  return {
    filas: periodos.map((periodo) => {
      const g = grupos.get(periodo);
      return {
        periodo,
        cantidad: g?.ids.length ?? null,
        porGrupo: g?.porGrupo ?? {},
        eventoIds: g?.ids ?? [],
      };
    }),
    sinMes,
  };
}
export function resumenCumplimiento(acciones: readonly AccionLectura[]) {
  const unicos = unicosPorId(acciones);
  const estados = Object.fromEntries(ESTADOS_VERIFICADOS.map((e) => [e, 0])) as Record<
    EstadoVerificado,
    number
  >;
  for (const a of unicos) estados[a.estadoVerificado]++;
  const cerradas = estados['Cerrada con evidencia'];
  return {
    total: unicos.length,
    estados,
    cerradas,
    porcentajeCierre: unicos.length ? (cerradas / unicos.length) * 100 : null,
    cierresImportadosParciales: unicos.filter(
      (a) => a.estadoImportado === 'Cerrada con evidencia' && a.coberturaParcial,
    ).length,
  };
}
function cumplimiento(
  acciones: readonly AccionLectura[],
  campo: 'proyectoCodigo' | 'eventoId',
  incluir: readonly string[],
) {
  const unicos = unicosPorId(acciones);
  const claves = [...new Set([...incluir, ...unicos.map((a) => a[campo])])].sort();
  return claves.map((clave) => ({
    clave,
    ...resumenCumplimiento(unicos.filter((a) => a[campo] === clave)),
  }));
}
export function cumplimientoPorProyecto(
  acciones: readonly AccionLectura[],
  proyectos: readonly string[] = [],
) {
  return cumplimiento(acciones, 'proyectoCodigo', proyectos);
}
export function cumplimientoPorEvento(
  acciones: readonly AccionLectura[],
  eventos: readonly string[] = [],
) {
  return cumplimiento(acciones, 'eventoId', eventos);
}
export function sumaConCobertura(
  eventos: readonly EventoLectura[],
  campo: 'diasPerdidos' | 'costo',
) {
  const unicos = unicosPorId(eventos);
  const conocidos = unicos.flatMap((e) =>
    typeof e[campo] === 'number' ? [e[campo] as number] : [],
  );
  return {
    valor: conocidos.length ? conocidos.reduce((s, n) => s + n, 0) : null,
    conDato: conocidos.length,
    sinDato: unicos.length - conocidos.length,
    total: unicos.length,
    etiqueta: 'Suma de valores consignados — detalle incompleto, no oficial',
  };
}
