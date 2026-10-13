import { acotar, type Vec3 } from './cinematica';
import { formatoNarrativo, type ResumenPresentacion } from './presentacion';

/** Propuesta cinematográfica independiente: geometría ilustrativa, no una unidad real. */
export const CAPITULOS = [
  { id: 'apertura', titulo: 'Apertura' },
  { id: 'operacion', titulo: 'La operación en cifras' },
  { id: 'proyectos', titulo: 'Frentes de trabajo' },
  { id: 'indices', titulo: 'Índices oficiales' },
  { id: 'potencial', titulo: 'Alto potencial' },
  { id: 'nucleo', titulo: 'La sala de datos' },
] as const;

/** Progreso hasta el que llega la entrada en escena automática; después manda el desplazamiento. */
export const INTRO_FIN = 0.14;
/** A partir de este progreso la cámara abandona la ruta y entra en órbita alrededor del núcleo. */
export const TRAMO_ORBITA = 0.86;
/** Núcleo de datos al final de la galería; la órbita se mantiene dentro de la bóveda (radio 3.8). */
export const NUCLEO = {
  centro: [0, 2.35, -88] as Vec3,
  radioCamara: 2.9,
  alturaCamara: 3.1,
} as const;

interface ClaveRuta {
  posicion: Vec3;
  mirada: Vec3;
  fov: number;
}
/** Travelling editorial: entrada por el portal, vaivenes laterales y aproximación final al núcleo. */
export const RUTA_PROPUESTA: readonly ClaveRuta[] = [
  { posicion: [0, 2.3, 17], mirada: [0, 2.3, -6], fov: 68 },
  { posicion: [-1.5, 2.1, 2], mirada: [0.4, 2.5, -14], fov: 64 },
  { posicion: [1.3, 2.7, -18], mirada: [-0.4, 2.2, -34], fov: 60 },
  { posicion: [-1.7, 1.8, -40], mirada: [0.5, 2.5, -56], fov: 57 },
  { posicion: [1.2, 2.9, -62], mirada: [0, 2.3, -80], fov: 60 },
  // El último encuadre coincide con la órbita en ángulo 0 para una transición sin salto.
  {
    posicion: [0, NUCLEO.alturaCamara, NUCLEO.centro[2] + NUCLEO.radioCamara],
    mirada: [...NUCLEO.centro],
    fov: 58,
  },
];

function suave(t: number): number {
  const x = acotar(t);
  return x * x * (3 - 2 * x);
}
function mezclarVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
export interface PosePropuesta {
  posicion: Vec3;
  mirada: Vec3;
  fov: number;
}
function poseEnRuta(t: number): PosePropuesta {
  const tramos = RUTA_PROPUESTA.length - 1;
  const x = acotar(t) * tramos;
  const i = Math.min(Math.floor(x), tramos - 1);
  const k = suave(x - i);
  const a = RUTA_PROPUESTA[i] ?? RUTA_PROPUESTA[0]!;
  const b = RUTA_PROPUESTA[i + 1] ?? a;
  return {
    posicion: mezclarVec3(a.posicion, b.posicion, k),
    mirada: mezclarVec3(a.mirada, b.mirada, k),
    fov: a.fov + (b.fov - a.fov) * k,
  };
}
/** Órbita circular alrededor del núcleo; el ángulo suma giro libre del usuario y autorrotación. */
export function poseOrbita(angulo: number): PosePropuesta {
  const { centro, radioCamara, alturaCamara } = NUCLEO;
  return {
    posicion: [
      centro[0] + Math.sin(angulo) * radioCamara,
      alturaCamara,
      centro[2] + Math.cos(angulo) * radioCamara,
    ],
    mirada: [...centro],
    fov: 56,
  };
}
/** Pose única de la cámara: ruta con travelling hasta TRAMO_ORBITA y después órbita fundida. */
export function posePropuesta(progreso: number, anguloOrbita: number): PosePropuesta {
  const p = acotar(progreso);
  if (p >= 1) return poseOrbita(anguloOrbita);
  if (p <= TRAMO_ORBITA) return poseEnRuta(p / TRAMO_ORBITA);
  const mezcla = suave((p - TRAMO_ORBITA) / (1 - TRAMO_ORBITA));
  const a = poseEnRuta(1);
  const b = poseOrbita(anguloOrbita);
  return {
    posicion: mezclarVec3(a.posicion, b.posicion, mezcla),
    mirada: mezclarVec3(a.mirada, b.mirada, mezcla),
    fov: a.fov + (b.fov - a.fov) * mezcla,
  };
}

export type TipoNodo = 'proyecto' | 'baliza' | 'indice' | 'cierre';
export interface NodoPropuesta {
  clave: string;
  tipo: TipoNodo;
  titulo: string;
  detalle: string;
  href: string;
  posicion: Vec3;
  color: string;
  radio: number;
}
const COLORES_NODO: Record<TipoNodo, string> = {
  proyecto: '#52d0ff',
  baliza: '#ffc000',
  indice: '#8fc4ec',
  cierre: '#2fa385',
};
/** Posiciones deterministas alrededor del núcleo, derivadas del resumen; nunca constantes de texto. */
export function constelacionPropuesta(data: ResumenPresentacion): NodoPropuesta[] {
  const [cx, cy, cz] = NUCLEO.centro;
  const nodos: NodoPropuesta[] = [];
  const proyectos = data.proyectosDetalle.slice(0, 7);
  const maxEventos = Math.max(1, ...proyectos.map((p) => p.eventos));
  proyectos.forEach((p, i) => {
    const angulo = (i / Math.max(1, proyectos.length)) * Math.PI * 2;
    nodos.push({
      clave: `proyecto-${p.codigo}`,
      tipo: 'proyecto',
      titulo: p.nombre,
      detalle: `${formatoNarrativo(p.eventos)} eventos documentales`,
      href: `/eventos?proyectos=${encodeURIComponent(`"${p.codigo}"`)}`,
      posicion: [
        cx + Math.cos(angulo) * 2.1,
        cy + Math.sin(i * 2.3) * 0.7,
        cz + Math.sin(angulo) * 2.1,
      ],
      color: COLORES_NODO.proyecto,
      radio: 0.09 + 0.11 * Math.sqrt(p.eventos / maxEventos),
    });
  });
  data.balizas.slice(0, 9).forEach((b, i) => {
    const angulo = (i / Math.max(1, Math.min(9, data.balizas.length))) * Math.PI * 2 + 0.5;
    nodos.push({
      clave: `baliza-${b.id}`,
      tipo: 'baliza',
      titulo: `Evento ${b.id}`,
      detalle: `Alto potencial · Riesgo crítico: ${b.riesgo}`,
      href: `/eventos/${b.id}`,
      posicion: [
        cx + Math.cos(angulo) * 1.35,
        cy + Math.cos(i * 1.7) * 0.55,
        cz + Math.sin(angulo) * 1.35,
      ],
      color: COLORES_NODO.baliza,
      radio: 0.075,
    });
  });
  const indices: [string, number | null][] = [
    ['IF', data.indicadores.if],
    ['IS', data.indicadores.is],
    ['IA', data.indicadores.ia],
  ];
  indices.forEach(([sigla, valor], i) => {
    if (valor === null) return;
    nodos.push({
      clave: `indice-${sigla}`,
      tipo: 'indice',
      titulo: `Índice ${sigla} · ${data.indicadores.anio}`,
      detalle: `${formatoNarrativo(valor, sigla === 'IA' ? 3 : 2)} · ${data.indicadores.fuente ?? 'Fuente no consta'}`,
      href: '/analisis',
      posicion: [cx + (i - 1) * 0.85, cy + 1.4, cz],
      color: COLORES_NODO.indice,
      radio: 0.1,
    });
  });
  nodos.push({
    clave: 'cierre-nucleo',
    tipo: 'cierre',
    titulo: 'Cierre verificado',
    detalle: `${formatoNarrativo(data.porcentajeCierre, 1)}% de acciones cerradas según corte; revisar alcance`,
    href: '/acciones',
    posicion: [cx, cy, cz],
    color: COLORES_NODO.cierre,
    radio: 0.17,
  });
  return nodos;
}
/** Recorrido circular por el catálogo de la constelación, para teclado y botones ◀ ▶. */
export function vecinoNodo(
  nodos: readonly NodoPropuesta[],
  actual: string | null,
  paso: number,
): string | null {
  if (nodos.length === 0) return null;
  const i = nodos.findIndex((n) => n.clave === actual);
  if (i < 0) return nodos[paso >= 0 ? 0 : nodos.length - 1]!.clave;
  return nodos[(i + paso + nodos.length) % nodos.length]!.clave;
}
