import type { LeccionLectura } from '../types';
import { textoBusqueda } from './filtros';
export const JERARQUIA_LECCION = [
  ['eliminacion', 'Eliminación'],
  ['sustitucion', 'Sustitución'],
  ['ingenieria', 'Ingeniería'],
  ['administrativos', 'Administrativos'],
  ['epp', 'EPP'],
] as const;
export function textoLeccion(l: LeccionLectura): string {
  return textoBusqueda(
    [
      l.id,
      l.quePaso,
      l.porQue,
      l.leccion,
      l.riesgoCritico,
      l.actividadCritica,
      l.aplicabilidad,
      ...l.proyectoCodigos,
      ...Object.values(l.controles),
    ]
      .filter((s): s is string => typeof s === 'string')
      .join(' '),
  );
}
export function filasDifusion(l: LeccionLectura): { titulo: string; texto: string }[] {
  return [
    { titulo: 'QUÉ PASÓ', texto: l.quePaso },
    { titulo: 'POR QUÉ', texto: l.porQue },
    { titulo: 'LECCIÓN APRENDIDA', texto: l.leccion },
    ...JERARQUIA_LECCION.map(([key, label]) => ({
      titulo: label.toUpperCase(),
      texto: l.controles[key] ?? 'No consta',
    })),
    { titulo: 'ACTIVIDAD CRÍTICA', texto: l.actividadCritica },
    { titulo: 'APLICABILIDAD', texto: l.aplicabilidad },
    { titulo: 'EVENTOS ORIGEN', texto: l.eventoIds.join(' · ') || 'Sin vínculos' },
    { titulo: 'FUENTES DOCUMENTALES', texto: l.fuentes.join('\n') || 'Sin fuentes' },
  ];
}
