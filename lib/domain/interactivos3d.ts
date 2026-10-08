import { filtrosAParametros } from './filtrosURL';
import { formatoNarrativo, type ResumenPresentacion } from './presentacion';

export type TipoDato =
  'portal' | 'evento' | 'proyecto' | 'indicador' | 'baliza' | 'accion' | 'estacion' | 'leccion';
/** Identidad mínima compartida por el canvas y el DOM; nunca lleva texto ni posiciones. */
export interface ReferenciaDato {
  tipo: TipoDato;
  clave: string;
  escena: number;
}
export interface DatoInteractivo extends ReferenciaDato {
  titulo: string;
  lineas: readonly string[];
  href: string;
  /** 'contexto' conserva los filtros vigentes; 'directo' fija la ficha o el filtro propios del dato. */
  enlace: 'contexto' | 'directo';
  accion: string;
}
export function mismaReferencia(
  a: ReferenciaDato | null | undefined,
  b: ReferenciaDato | null | undefined,
): boolean {
  return !!a && !!b && a.tipo === b.tipo && a.clave === b.clave && a.escena === b.escena;
}
const MODULO_CICLO: Record<string, string> = {
  Reporte: '/eventos',
  Investigación: '/analisis',
  Acciones: '/acciones',
  Evidencia: '/acciones',
  Cierre: '/analisis',
  Lección: '/lecciones',
};
const texto = (valor: string | null | undefined) => (valor && valor.trim() ? valor : 'No consta');
const anio = (valor: unknown) =>
  typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : 'No consta';

/** Un dato interactivo por instalación del recorrido; los textos salen del resumen, no de constantes. */
export function catalogoInteractivo(data: ResumenPresentacion): DatoInteractivo[] {
  const nombres = new Map(data.proyectosDetalle.map((p) => [p.codigo, p.nombre] as const));
  const proyecto = (codigo: string | null | undefined) => {
    const nombre = codigo ? nombres.get(codigo) : undefined;
    return nombre ? `${codigo} · ${nombre}` : texto(codigo);
  };
  const portal: DatoInteractivo = {
    tipo: 'portal',
    clave: 'portal',
    escena: 0,
    titulo: 'INCIMMET · Gestión SSOMA',
    lineas: [
      `${data.eventos} registros documentales`,
      `${data.proyectos} proyectos`,
      `${anio(data.anioDesde)}–${anio(data.anioHasta)}`,
    ],
    href: '/dashboard',
    enlace: 'contexto',
    accion: 'Explorar dashboard',
  };
  const eventos: DatoInteractivo[] = data.puntosEventos.map((e) => ({
    tipo: 'evento',
    clave: e.id,
    escena: 1,
    titulo: e.id,
    lineas: [texto(e.grupo), `Proyecto ${proyecto(e.proyecto)}`, `Año ${anio(e.anio)}`],
    href: `/eventos/${encodeURIComponent(e.id)}`,
    enlace: 'directo',
    accion: 'Abrir ficha del evento',
  }));
  const proyectos: DatoInteractivo[] = data.proyectosDetalle.map((p) => ({
    tipo: 'proyecto',
    clave: p.codigo,
    escena: 2,
    titulo: p.nombre,
    lineas: [`Código ${p.codigo}`, `${p.eventos} registros documentados`],
    href: `/eventos?${filtrosAParametros({ proyectos: [p.codigo] }).toString()}`,
    enlace: 'directo',
    accion: 'Ver eventos del proyecto',
  }));
  const indicadores: DatoInteractivo[] = (
    [
      ['IF', 'Índice de frecuencia', data.indicadores.if, 2],
      ['IS', 'Índice de severidad', data.indicadores.is, 2],
      ['IA', 'Índice de accidentabilidad', data.indicadores.ia, 3],
    ] as const
  ).map(([sigla, nombre, valor, decimales]) => ({
    tipo: 'indicador',
    clave: sigla,
    escena: 3,
    titulo: `${sigla} · ${nombre}`,
    lineas: [
      formatoNarrativo(valor, decimales),
      `${data.indicadores.ambitoNombre} · ${data.indicadores.anio}`,
      `Fuente: ${texto(data.indicadores.fuente)}`,
    ],
    href: '/analisis',
    enlace: 'contexto',
    accion: 'Revisar análisis e indicadores',
  }));
  const balizas: DatoInteractivo[] = data.balizas.map((b) => ({
    tipo: 'baliza',
    clave: b.id,
    escena: 4,
    titulo: b.id,
    lineas: [
      'Alto potencial documentado',
      `Proyecto ${proyecto(b.proyecto)}`,
      `Riesgo crítico: ${texto(b.riesgo)}`,
    ],
    href: `/eventos/${encodeURIComponent(b.id)}`,
    enlace: 'directo',
    accion: 'Abrir ficha del evento',
  }));
  const acciones: DatoInteractivo[] = data.tarjetasAcciones.map((a) => ({
    tipo: 'accion',
    clave: a.id,
    escena: 5,
    titulo: a.id,
    lineas: [
      a.cerrada
        ? 'Cerrada con evidencia según corte documental'
        : 'Sin cierre verificado según corte documental',
      ...(a.parcial ? ['Evidencia de alcance parcial'] : []),
    ],
    href: `/acciones?accion=${encodeURIComponent(a.id)}`,
    enlace: 'contexto',
    accion: 'Abrir la acción',
  }));
  const estaciones: DatoInteractivo[] = data.ciclo.map((c) => ({
    tipo: 'estacion',
    clave: c.titulo,
    escena: 6,
    titulo: c.titulo,
    lineas: [`${c.cantidad} · ${c.detalle}`],
    href: MODULO_CICLO[c.titulo] ?? '/dashboard',
    enlace: 'contexto',
    accion: 'Abrir el módulo',
  }));
  const lecciones: DatoInteractivo = {
    tipo: 'leccion',
    clave: 'lecciones',
    escena: 7,
    titulo: 'Lecciones catalogadas',
    lineas: [
      `${data.lecciones} lecciones`,
      'Catalogada no acredita publicación ni difusión formal.',
    ],
    href: '/lecciones',
    enlace: 'contexto',
    accion: 'Consultar lecciones',
  };
  return [
    portal,
    ...eventos,
    ...proyectos,
    ...indicadores,
    ...balizas,
    ...acciones,
    ...estaciones,
    lecciones,
  ];
}
export function datosDeEscena(
  catalogo: readonly DatoInteractivo[],
  escena: number,
): DatoInteractivo[] {
  return catalogo.filter((d) => d.escena === escena);
}
export function buscarDato(
  catalogo: readonly DatoInteractivo[],
  ref: ReferenciaDato | null | undefined,
): DatoInteractivo | null {
  return catalogo.find((d) => mismaReferencia(d, ref)) ?? null;
}
/** Recorrido circular por los datos de una escena; sin dato previo empieza por el primero o el último. */
export function vecinoEnEscena(
  catalogo: readonly DatoInteractivo[],
  actual: ReferenciaDato | null,
  escena: number,
  paso: 1 | -1,
): DatoInteractivo | null {
  const lista = datosDeEscena(catalogo, escena);
  if (!lista.length) return null;
  const i = actual ? lista.findIndex((d) => mismaReferencia(d, actual)) : -1;
  if (i < 0) return (paso === 1 ? lista[0] : lista[lista.length - 1]) ?? null;
  return lista[(i + paso + lista.length) % lista.length] ?? null;
}
