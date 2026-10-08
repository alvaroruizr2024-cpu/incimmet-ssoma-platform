import type { EstadoVerificado, EvidenciaLocal, AccionLectura } from '../types';
import { diasEntre, exigirFechaISO, instanteHastaCorte } from './fechas';

export const ESTADOS_VERIFICADOS: readonly EstadoVerificado[] = [
  'Cerrada con evidencia',
  'Declarada cerrada sin evidencia',
  'Abierta',
  'Vencida',
  'Sin información',
];
export interface EntradaEstado {
  fechaCompromiso?: string | null;
  estadoDeclarado?: string | null;
  fechaEstadoDeclarado?: string | null;
  evidencias?: readonly EvidenciaLocal[];
  proyectosRequeridos: readonly string[];
}
/** Una referencia EVD nunca es una evidencia binaria validada. */
export function evidenciaSuficiente(
  evidencia: EvidenciaLocal,
  corte: string,
  proyectos: readonly string[],
): boolean {
  const v = evidencia.validacion;
  return Boolean(
    evidencia.archivo.blob.size > 0 &&
    evidencia.archivo.bytes === evidencia.archivo.blob.size &&
    v?.aceptada === true &&
    v.rol === 'SSOMA corporativo' &&
    v.alcanceCompleto === true &&
    evidencia.subidoPorRol !== v.rol &&
    v.motivo.trim() &&
    proyectos.length > 0 &&
    proyectos.every((p) => v.proyectosCubiertos.includes(p)) &&
    instanteHastaCorte(evidencia.creadoEn, corte) &&
    instanteHastaCorte(v.fecha, corte) &&
    Date.parse(v.fecha) >= Date.parse(evidencia.creadoEn),
  );
}
export function declaracionCerrada(texto: string | null | undefined): boolean {
  // La cláusula inicial prevalece frente a «estado global: En proceso 80%».
  return /^(cerrad[ao]|finalizad[ao]|realizad[ao]|implementad[ao]|completad[ao]|concluid[ao])\b/i.test(
    texto?.trim() ?? '',
  );
}
export function calcularEstadoVerificado(
  accion: EntradaEstado,
  fechaCorte: string,
): EstadoVerificado {
  exigirFechaISO(fechaCorte);
  if (
    accion.evidencias?.some((e) => evidenciaSuficiente(e, fechaCorte, accion.proyectosRequeridos))
  ) {
    return 'Cerrada con evidencia';
  }
  let declaracion = accion.estadoDeclarado ?? '';
  if (accion.fechaEstadoDeclarado) {
    exigirFechaISO(accion.fechaEstadoDeclarado);
    if (accion.fechaEstadoDeclarado > fechaCorte) declaracion = '';
  }
  if (declaracionCerrada(declaracion)) return 'Declarada cerrada sin evidencia';
  if (accion.fechaCompromiso) {
    exigirFechaISO(accion.fechaCompromiso);
    return accion.fechaCompromiso < fechaCorte ? 'Vencida' : 'Abierta';
  }
  if (/en proceso/i.test(declaracion)) return 'Abierta';
  return 'Sin información';
}
export function semaforoFecha(fecha: string | null | undefined, corte: string, aviso = 7) {
  exigirFechaISO(corte);
  if (!Number.isInteger(aviso) || aviso < 0) throw new Error('Umbral de aviso inválido');
  if (!fecha)
    return { estado: 'sin_fecha', dias: null, etiqueta: 'Fecha compromiso: No consta' } as const;
  const dias = diasEntre(corte, fecha);
  if (dias < 0)
    return { estado: 'vencida', dias, etiqueta: `Compromiso vencido hace ${-dias} días` } as const;
  if (dias === 0) return { estado: 'hoy', dias, etiqueta: 'Vence hoy' } as const;
  if (dias <= aviso) return { estado: 'proxima', dias, etiqueta: `Vence en ${dias} días` } as const;
  return { estado: 'en_plazo', dias, etiqueta: 'En plazo' } as const;
}
export function puedeCerrarEvento(
  acciones: readonly EstadoVerificado[],
  investigacionRequerida: boolean,
  investigacionRevisada: boolean,
  resolucionSinAcciones = false,
): boolean {
  if (investigacionRequerida && !investigacionRevisada) return false;
  if (acciones.length === 0) return resolucionSinAcciones;
  return acciones.every((a) => a === 'Cerrada con evidencia');
}

/** Puerta para el modelo de lectura: nunca usa un cierre histórico como aprobación local. */
export function puedeCerrarEventoOperativo(
  acciones: readonly AccionLectura[],
  investigacionRequerida: boolean,
  investigacionRevisada: boolean,
  resolucionSinAcciones = false,
): boolean {
  return puedeCerrarEvento(
    acciones.map((a) => a.estadoOperativo ?? 'Sin información'),
    investigacionRequerida,
    investigacionRevisada,
    resolucionSinAcciones,
  );
}
