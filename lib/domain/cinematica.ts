/** Geometría y movimiento ilustrativos; no son dimensiones de una mina real. */
export type Calidad3D = 'alta' | 'equilibrada' | 'baja';
export type ModoGrafico = Calidad3D | '2d';
export type Vec3 = [number, number, number];
export interface Tramo {
  desde: Vec3;
  hasta: Vec3;
}
export const GALERIA = { radio: 3.8, arranque: 1.65, inicioZ: 8, finZ: -94 } as const;
export const ESCENAS = [
  { id: 'inicio', titulo: 'El camino' },
  { id: 'eventos', titulo: 'Base documental' },
  { id: 'proyectos', titulo: 'Proyectos' },
  { id: 'indicadores', titulo: 'Indicadores oficiales' },
  { id: 'potencial', titulo: 'Alto potencial' },
  { id: 'evidencia', titulo: 'La brecha de evidencia' },
  { id: 'plataforma', titulo: 'La plataforma' },
  { id: 'continuar', titulo: 'Del aprendizaje a la acción' },
] as const;
export function acotar(n: number, min = 0, max = 1): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
export function degradarCalidad(actual: ModoGrafico): ModoGrafico {
  return actual === 'alta' ? 'equilibrada' : actual === 'equilibrada' ? 'baja' : '2d';
}
export function perfilCalidad(calidad: Calidad3D) {
  return calidad === 'alta'
    ? { dprMax: 1.5, segmentosBoveda: 28, pasoMalla: 0.6, polvo: 180, capasNiebla: 7 }
    : calidad === 'equilibrada'
      ? { dprMax: 1.25, segmentosBoveda: 20, pasoMalla: 0.85, polvo: 70, capasNiebla: 3 }
      : { dprMax: 1, segmentosBoveda: 14, pasoMalla: 1.2, polvo: 0, capasNiebla: 0 };
}
export function modoInicial(s: {
  webgl: boolean;
  reducido: boolean;
  memoria?: number;
  nucleos?: number;
  movil?: boolean;
  ahorro?: boolean;
}): ModoGrafico {
  if (
    !s.webgl ||
    s.reducido ||
    s.ahorro ||
    (s.memoria !== undefined && s.memoria <= 2) ||
    (s.nucleos !== undefined && s.nucleos <= 2)
  )
    return '2d';
  if ((s.memoria !== undefined && s.memoria <= 4) || (s.nucleos !== undefined && s.nucleos <= 4))
    return 'baja';
  return s.movil ? 'equilibrada' : 'alta';
}
/** Normaliza por posiciones reales de las secciones, incluso con zoom y texto largo. */
export function progresoNarrativo(scrollY: number, comienzos: readonly number[]): number {
  if (comienzos.length < 2) return 0;
  const first = comienzos[0] ?? 0;
  if (scrollY <= first) return 0;
  for (let i = 1; i < comienzos.length; i++) {
    const inicio = comienzos[i - 1] ?? first;
    const fin = comienzos[i] ?? inicio;
    if (scrollY < fin)
      return (
        (i - 1 + acotar((scrollY - inicio) / Math.max(1, fin - inicio))) / (comienzos.length - 1)
      );
  }
  return 1;
}

/** Encuadres editoriales: avance, giro y pausa frente a cada instalación de datos. */
export const ENCUADRES: readonly { posicion: Vec3; mirada: Vec3 }[] = [
  { posicion: [-1.35, 1.9, 5.5], mirada: [0.5, 2.6, -5] },
  { posicion: [-1.5, 2.2, -7], mirada: [0.1, 2.8, -16] },
  { posicion: [-1.8, 2.5, -20], mirada: [0.5, 2.3, -29] },
  { posicion: [-1.45, 2.0, -32], mirada: [0.2, 2.7, -40] },
  { posicion: [-1.5, 1.6, -44], mirada: [0.2, 1.9, -52] },
  { posicion: [-1.3, 2.7, -56], mirada: [0.2, 2.9, -64] },
  { posicion: [-1.6, 2.1, -68], mirada: [0.4, 2.3, -77] },
  { posicion: [-1.15, 2.1, -82], mirada: [0.6, 2.8, -97] },
];
/** Fase compartida por cámara, óptica y acentos: 0–0.2 llegada, 0.2–0.82 avance, 0.82–1 pausa de lectura. */
function faseTramo(progreso: number) {
  const t = acotar(progreso) * (ENCUADRES.length - 1),
    i = Math.floor(t),
    local = t - i;
  const fase = acotar((local - 0.2) / 0.62);
  return { i, fase, suave: fase * fase * (3 - 2 * fase) };
}
export function poseCamara(progreso: number): { posicion: Vec3; mirada: Vec3 } {
  const { i, suave } = faseTramo(progreso);
  const a = ENCUADRES[i] ?? ENCUADRES[0]!,
    b = ENCUADRES[Math.min(i + 1, ENCUADRES.length - 1)]!;
  const mezclar = (desde: Vec3, hasta: Vec3): Vec3 => [
    desde[0] + (hasta[0] - desde[0]) * suave,
    desde[1] + (hasta[1] - desde[1]) * suave,
    desde[2] + (hasta[2] - desde[2]) * suave,
  ];
  return { posicion: mezclar(a.posicion, b.posicion), mirada: mezclar(a.mirada, b.mirada) };
}
export type MotivoFallback3D = 'rendimiento' | 'contexto' | 'error';
export const MENSAJES_FALLBACK: Record<MotivoFallback3D, string> = {
  rendimiento:
    'Rendimiento insuficiente: se muestra la versión 2D. Puede reintentar en calidad baja.',
  contexto: 'Se perdió el contexto gráfico. La narrativa sigue disponible; puede reintentar 3D.',
  error: 'No se pudo iniciar el motor 3D. Se conserva el contenido en 2D y se permite reintentar.',
};
/** No evaluar durante compilación inicial, reposo o pestaña oculta. */
export function puedeMedirRendimiento(
  activo: boolean,
  calentando: boolean,
  enMovimiento: boolean,
): boolean {
  return activo && !calentando && enMovimiento;
}
export function puntoBoveda(angulo: number, z: number, radio: number = GALERIA.radio): Vec3 {
  return [Math.cos(angulo) * radio, GALERIA.arranque + Math.sin(angulo) * radio, z];
}
export function mallaBoveda(calidad: Calidad3D): Tramo[] {
  const p = perfilCalidad(calidad),
    segmentos = p.segmentosBoveda;
  const tramos: Tramo[] = [];
  for (let z: number = GALERIA.inicioZ; z >= GALERIA.finZ; z -= p.pasoMalla) {
    for (let i = 0; i < segmentos; i++) {
      tramos.push({
        desde: puntoBoveda((i / segmentos) * Math.PI, z, GALERIA.radio - 0.07),
        hasta: puntoBoveda(((i + 1) / segmentos) * Math.PI, z, GALERIA.radio - 0.07),
      });
    }
  }
  for (let i = 0; i <= segmentos; i++) {
    const angulo = (i / segmentos) * Math.PI;
    tramos.push({
      desde: puntoBoveda(angulo, GALERIA.inicioZ, GALERIA.radio - 0.07),
      hasta: puntoBoveda(angulo, GALERIA.finZ, GALERIA.radio - 0.07),
    });
  }
  return tramos;
}
export function pernosBoveda(): Tramo[] {
  const tramos: Tramo[] = [];
  for (let z: number = GALERIA.inicioZ; z >= GALERIA.finZ; z -= 2.5) {
    for (let i = 0; i < 7; i++) {
      const angulo = 0.18 + (i / 6) * (Math.PI - 0.36);
      tramos.push({
        desde: puntoBoveda(angulo, z, GALERIA.radio - 0.25),
        hasta: puntoBoveda(angulo, z, GALERIA.radio + 0.12),
      });
    }
  }
  return tramos;
}
/** PRNG local reproducible: ni aleatoriedad por render ni recursos externos. */
export function aleatorioSemilla(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/** Óptica ilustrativa: la lente se cierra en cada pausa de lectura, se abre al avanzar y más aún en la salida. */
export const OPTICA = { fovPausa: 57, fovAvance: 64, fovSalida: 68, balanceoMax: 0.02 } as const;
export function opticaCamara(progreso: number): { fov: number; balanceo: number } {
  const { i, fase } = faseTramo(progreso);
  const avance = Math.sin(fase * Math.PI);
  const tramos = ENCUADRES.length - 1;
  const final = acotar((acotar(progreso) - (tramos - 1) / tramos) * tramos);
  const salida = final * final * (3 - 2 * final);
  const enRuta = OPTICA.fovPausa + (OPTICA.fovAvance - OPTICA.fovPausa) * avance;
  const a = ENCUADRES[i] ?? ENCUADRES[0]!,
    b = ENCUADRES[Math.min(i + 1, tramos)]!;
  return {
    fov: enRuta + (OPTICA.fovSalida - enRuta) * salida,
    balanceo: acotar(
      (a.posicion[0] - b.posicion[0]) * 0.08 * avance,
      -OPTICA.balanceoMax,
      OPTICA.balanceoMax,
    ),
  };
}
/** Presencia 0–1 de una instalación: se ensambla al acercarse, se sostiene en la pausa y se recoge al alejarse. */
export const VENTANA_MOMENTO = 1.02;
export function presenciaMomento(indice: number, progreso: number): number {
  const distancia = Math.abs(indice - acotar(progreso) * (ESCENAS.length - 1));
  if (!(distancia < VENTANA_MOMENTO)) return 0;
  const borde = acotar((1 - distancia / VENTANA_MOMENTO) / 0.55);
  return borde * borde * (3 - 2 * borde);
}
/** Acento lumínico por escena: cian de galería, ámbar en alto potencial, verde de evidencia y luz cálida de salida. */
export const ACENTOS_ESCENA = [
  '#6bbbef',
  '#52d0ff',
  '#1d7dcc',
  '#8fc4ec',
  '#ffc000',
  '#2fa385',
  '#00b0f0',
  '#ffd59f',
] as const;
export function acentoEscena(progreso: number): { desde: string; hasta: string; mezcla: number } {
  const { i, suave } = faseTramo(progreso);
  const ultimo = ACENTOS_ESCENA.length - 1;
  return {
    desde: ACENTOS_ESCENA[Math.min(i, ultimo)] ?? ACENTOS_ESCENA[0],
    hasta: ACENTOS_ESCENA[Math.min(i + 1, ultimo)] ?? ACENTOS_ESCENA[0],
    mezcla: suave,
  };
}
/** Mirada libre con puntero fino: desplaza el objetivo y apenas la posición; la cámara sigue dentro de la galería. */
export const MIRADA_LIBRE = {
  objetivoX: 0.7,
  objetivoY: 0.35,
  posicionX: 0.12,
  posicionY: 0.06,
} as const;
export type Vec2 = [number, number];
export function desplazamientoMirada(
  puntero: readonly [number, number],
  activo = true,
): { objetivo: Vec2; posicion: Vec2 } {
  const eje = (n: number) => (activo && Number.isFinite(n) ? Math.min(1, Math.max(-1, n)) : 0);
  const x = eje(puntero[0]),
    y = eje(puntero[1]);
  return {
    objetivo: [x * MIRADA_LIBRE.objetivoX, y * MIRADA_LIBRE.objetivoY],
    posicion: [x * MIRADA_LIBRE.posicionX, y * MIRADA_LIBRE.posicionY],
  };
}
/** Velocidad narrativa 0–1: progreso por segundo frente a un desplazamiento rápido de referencia. */
export const VELOCIDAD_REFERENCIA = 0.35;
export function velocidadNarrativa(anterior: number, actual: number, segundos: number): number {
  return acotar(Math.abs(actual - anterior) / Math.max(segundos, 1 / 240) / VELOCIDAD_REFERENCIA);
}
