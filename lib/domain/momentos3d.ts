import type { ResumenPresentacion } from './presentacion';
import { aleatorioSemilla, type Vec3 } from './cinematica';
export const COLORES_EVENTO: Record<string, string> = {
  Accidente: '#8DB7FF',
  Incidente: '#1D7DCC',
  'Daño a la propiedad': '#00B0F0',
  Desvío: '#94B6D9',
  Ambiental: '#2D5E94',
  'En investigación': '#D1D5DB',
};
export interface InstanciaDato {
  id: string;
  posicion: Vec3;
  escala: Vec3;
  color: string;
  rotacion?: Vec3;
  intensidad?: number;
}
export function lucesEventos(data: ResumenPresentacion): InstanciaDato[] {
  const random = aleatorioSemilla(22507);
  return data.puntosEventos.map((e, i) => {
    const filas = Math.ceil(Math.sqrt(data.puntosEventos.length)),
      x = (i % filas) / Math.max(1, filas - 1);
    const y = Math.floor(i / filas) / Math.max(1, Math.ceil(data.puntosEventos.length / filas) - 1);
    return {
      id: e.id,
      posicion: [(x - 0.5) * 3.8, (y - 0.5) * 3.35, -random() * 2.6],
      escala: [0.045, 0.045, 0.045],
      color: COLORES_EVENTO[e.grupo] ?? '#D1D5DB',
      intensidad: 1.7,
    };
  });
}
export function tarjetasEvidencia(data: ResumenPresentacion): InstanciaDato[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(data.tarjetasAcciones.length * 1.2))),
    rows = Math.max(1, Math.ceil(data.tarjetasAcciones.length / cols));
  return data.tarjetasAcciones.map((a, i) => ({
    id: a.id,
    posicion: [
      ((i % cols) - (cols - 1) / 2) * 0.21,
      ((rows - 1) / 2 - Math.floor(i / cols)) * 0.25,
      Math.sin(i * 0.51) * 0.075,
    ],
    escala: [0.17, 0.2, 0.035],
    color: a.cerrada ? '#00B050' : '#304154',
    rotacion: [0, Math.sin(i * 0.7) * 0.15, Math.sin(i * 0.2) * 0.035],
    intensidad: a.cerrada ? 4 : 0.6,
  }));
}
export function estacionesProyectos(data: ResumenPresentacion) {
  const max = Math.max(1, ...data.proyectosDetalle.map((p) => p.eventos));
  return data.proyectosDetalle.map((p, i) => ({
    ...p,
    posicion: [((i % 3) - 1) * 1.28, 0, -Math.floor(i / 3) * 1.1] as Vec3,
    altura: 0.72 + Math.sqrt(p.eventos / max) * 1.55,
  }));
}
export function panelesIndicadores(data: ResumenPresentacion) {
  return [
    { sigla: 'IF', valor: data.indicadores.if, decimales: 2 },
    { sigla: 'IS', valor: data.indicadores.is, decimales: 2 },
    { sigla: 'IA', valor: data.indicadores.ia, decimales: 3 },
  ];
}
