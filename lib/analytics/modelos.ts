import type { AccionLectura, BaseNormalizada, EventoLectura, Filtros, GrupoEvento } from '../types';
import {
  contarEventos,
  coberturaAnual,
  matrizSeveridad,
  cumplimientoComparado,
  type DimensionConteo,
} from '../domain/analitica';
import {
  cumplimientoPorEvento,
  cumplimientoPorProyecto,
  mapaCalorProyectoMes,
  pareto,
  tendencias,
  type DimensionPareto,
} from '../domain/agregaciones';
import { ESTADOS_VERIFICADOS } from '../domain/estadoVerificado';

export interface PuntoGrafico {
  etiqueta: string;
  valor: number | null;
  serie?: string;
  x?: string;
  y?: string;
  acumulado?: number;
  detalle?: string;
  filtros?: Partial<Filtros>;
}
export interface ModeloGrafico {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'bar' | 'stacked' | 'line' | 'pareto' | 'heatmap' | 'donut' | 'grouped';
  puntos: PuntoGrafico[];
  categorias?: string[];
  filas?: string[];
  unidad?: string;
  referencia?: number;
  alto?: number;
  procedencia?: string;
  horizontal?: boolean;
}
export const COLORES_GRUPO: Record<string, string> = {
  Accidente: '#002060',
  Incidente: '#1D7DCC',
  'Daño a la propiedad': '#00B0F0',
  Desvío: '#94B6D9',
  Ambiental: '#315F94',
  'En investigación': '#64748B',
};
export const COLORES_ESTADO: Record<string, string> = {
  'Cerrada con evidencia': '#00B050',
  'Declarada cerrada sin evidencia': '#FFC000',
  Abierta: '#1D7DCC',
  Vencida: '#E53935',
  'Sin información': '#9E9E9E',
  Verificado: '#00B050',
  'Declarado explícitamente': '#FFC000',
};
const dimensiones = {
  proyectoCodigo: 'proyectos',
  tipoGrupo: 'grupos',
  tipo: 'tipos',
  riesgoCritico: 'riesgos',
  actividad: 'actividades',
  equipo: 'equipos',
  nivelIncimmet: 'niveles',
  pgIncimmet: 'potenciales',
} as const;
export function modeloConteo(
  eventos: readonly EventoLectura[],
  campo: DimensionConteo,
  titulo: string,
  tipo: 'bar' | 'donut' = 'bar',
): ModeloGrafico {
  return {
    id: `conteo-${campo}-${titulo}`,
    titulo,
    tipo,
    descripcion:
      'Registros documentados. Seleccione una marca para filtrar; repita la selección para quitarla.',
    puntos: contarEventos(eventos, campo)
      .sort((a, b) => {
        if (campo !== 'nivelIncimmet' && campo !== 'pgIncimmet') return 0;
        const orden = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'No consta'];
        return orden.indexOf(a.etiqueta) - orden.indexOf(b.etiqueta);
      })
      .map((f) => ({
        etiqueta: f.etiqueta,
        valor: f.cantidad,
        filtros: { [dimensiones[campo]]: [f.clave] },
      })),
  };
}
export function modeloTendencia(
  eventos: readonly EventoLectura[],
  frecuencia: 'anual' | 'mensual',
): ModeloGrafico {
  const datos = tendencias(eventos, frecuencia);
  const grupos = Object.keys(COLORES_GRUPO) as GrupoEvento[];
  return {
    id: `tendencia-${frecuencia}`,
    titulo: `Tendencia ${frecuencia} por grupo`,
    tipo: frecuencia === 'anual' ? 'stacked' : 'line',
    categorias: datos.filas.map((f) => f.periodo),
    descripcion: `Huecos = sin registros en esta base, no ausencia de hechos. ${datos.sinMes.length} evento(s) sin mes exacto fuera de la serie mensual.`,
    puntos: grupos.flatMap((grupo) =>
      datos.filas.map((f) => ({
        etiqueta: f.periodo,
        serie: grupo,
        valor: f.cantidad === null ? null : (f.porGrupo[grupo] ?? 0),
        filtros: {
          anios: [Number(f.periodo.slice(0, 4))],
          ...(frecuencia === 'mensual' ? { meses: [Number(f.periodo.slice(5))] } : {}),
          grupos: [grupo],
        },
      })),
    ),
  };
}
export function modeloPareto(
  eventos: readonly EventoLectura[],
  campo: DimensionPareto,
  titulo: string,
): ModeloGrafico {
  const datos = pareto(eventos, campo);
  return {
    id: `pareto-${campo}`,
    titulo,
    tipo: 'pareto',
    unidad: 'Registros',
    descripcion: `${datos.conDato}/${datos.total} registros con dato; ${datos.sinDato} «No consta» fuera del ranking. La línea 80% es referencia descriptiva, no meta SSOMA.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: f.categoria,
      valor: f.cantidad,
      acumulado: f.porcentajeAcumulado,
      detalle: f.contieneInferencia
        ? 'Texto de origen con inferencia; no es causa confirmada.'
        : undefined,
      filtros: { eventoIds: f.eventoIds },
    })),
  };
}
export function modeloCalor(
  eventos: readonly EventoLectura[],
  proyectos: readonly string[],
  anio: number,
): ModeloGrafico {
  const datos = mapaCalorProyectoMes(eventos, [anio], proyectos);
  return {
    id: `calor-${anio}`,
    titulo: `Proyecto × mes · ${anio}`,
    tipo: 'heatmap',
    categorias: datos.periodos,
    filas: [...proyectos],
    alto: 430,
    descripcion: `Sin registros no equivale a cero eventos. ${datos.sinMes.length} registros sin mes exacto.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: `${f.proyecto} · ${f.periodo}`,
      x: f.periodo,
      y: f.proyecto,
      valor: f.cantidad,
      detalle: f.cobertura,
      filtros: { proyectos: [f.proyecto], anios: [anio], meses: [Number(f.periodo.slice(5))] },
    })),
  };
}
export function modeloMatriz(eventos: readonly EventoLectura[]): ModeloGrafico {
  const datos = matrizSeveridad(eventos);
  return {
    id: 'matriz',
    titulo: 'Severidad observada × potencial INCIMMET',
    tipo: 'heatmap',
    categorias: datos.niveles,
    filas: datos.niveles,
    alto: 430,
    descripcion: `${datos.completos} pares completos; ${datos.faltantes} con algún faltante. Color = cantidad, no aceptabilidad del riesgo. X: potencial; Y: nivel observado.`,
    puntos: datos.filas.map((f) => ({
      etiqueta: `${f.nivel} × ${f.potencial}`,
      x: f.potencial,
      y: f.nivel,
      valor: f.cantidad,
      filtros: {
        niveles: [f.nivel === 'No consta' ? null : f.nivel],
        potenciales: [f.potencial === 'No consta' ? null : f.potencial],
      },
    })),
  };
}
export function modeloCumplimiento(
  acciones: readonly AccionLectura[],
  por: 'proyecto' | 'evento',
): ModeloGrafico {
  const filas =
    por === 'proyecto' ? cumplimientoPorProyecto(acciones) : cumplimientoPorEvento(acciones);
  return {
    id: `cumplimiento-${por}`,
    titulo: `Estado verificado por ${por}`,
    tipo: 'stacked',
    categorias: filas.map((f) => f.clave),
    alto: 400,
    descripcion:
      'Cada acción se cuenta una vez. El alcance transversal no multiplica acciones. Los cierres importados con cobertura parcial conservan su advertencia.',
    puntos: ESTADOS_VERIFICADOS.flatMap((estado) =>
      filas.map((f) => ({
        etiqueta: f.clave,
        valor: f.estados[estado],
        serie: estado,
        detalle: `${f.cerradas}/${f.total} con cierre según el contexto; ${f.cierresImportadosParciales} importados parciales.`,
        filtros: {
          ...(por === 'proyecto' ? { proyectos: [f.clave] } : { eventoIds: [f.clave] }),
          estadosAccion: [estado],
        },
      })),
    ),
  };
}
export function modeloComparado(acciones: readonly AccionLectura[]): ModeloGrafico {
  const datos = cumplimientoComparado(acciones);
  return {
    id: 'cumplimiento-comparado',
    titulo: 'Cierre verificado frente a declaración explícita',
    tipo: 'grouped',
    unidad: '% de acciones del proyecto',
    descripcion:
      'Series independientes, no se suman. Declarado = texto de origen que afirma cierre; no incluye cierres sin declaración explícita.',
    categorias: datos.map((f) => f.proyecto),
    puntos: datos.flatMap((f) => [
      {
        etiqueta: f.proyecto,
        serie: 'Verificado',
        valor: f.porcentajeCierre,
        detalle: `${f.cerradas}/${f.total} acciones`,
        filtros: { proyectos: [f.proyecto] },
      },
      {
        etiqueta: f.proyecto,
        serie: 'Declarado explícitamente',
        valor: f.porcentajeDeclarado,
        detalle: `${f.declaradas}/${f.total} acciones`,
        filtros: { proyectos: [f.proyecto] },
      },
    ]),
  };
}
export function modeloCobertura(base: BaseNormalizada): ModeloGrafico {
  const datos = coberturaAnual(
    base.eventos,
    base.proyectos.map((p) => p.codigo),
  );
  return {
    id: 'cobertura',
    titulo: 'Cobertura documental · año × proyecto',
    tipo: 'heatmap',
    categorias: [...new Set(datos.map((f) => String(f.anio)))],
    filas: base.proyectos.map((p) => p.codigo),
    alto: 460,
    descripcion:
      'Celdas vacías = sin registros disponibles. El conjunto no es un censo homogéneo de todos los años y proyectos.',
    puntos: datos.map((f) => ({
      etiqueta: `${f.proyecto} · ${f.anio}`,
      x: String(f.anio),
      y: f.proyecto,
      valor: f.cantidad,
      filtros: { anios: [f.anio], proyectos: [f.proyecto] },
    })),
  };
}

export function modeloProyectos(
  eventos: readonly EventoLectura[],
  proyectos: BaseNormalizada['proyectos'],
  titulo = 'Eventos por proyecto',
): ModeloGrafico {
  const m = modeloConteo(eventos, 'proyectoCodigo', titulo);
  return {
    ...m,
    horizontal: true,
    alto: Math.max(280, m.puntos.length * 32 + 45),
    puntos: [...m.puntos]
      .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0))
      .map((p) => ({
        ...p,
        etiqueta: proyectos.find((x) => x.codigo === p.etiqueta)?.nombre ?? p.etiqueta,
      })),
  };
}
