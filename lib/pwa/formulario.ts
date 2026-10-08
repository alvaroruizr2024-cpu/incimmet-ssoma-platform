import type { DataJson, ActorDemo, ReporteCampo } from '../types';
import type { FormularioCampo } from './types';
import { fechaLima } from '../domain/fechas';
import { validarReporte } from '../domain/reportes';
import { revisarPrivacidad } from '../domain/privacidad';
export function nuevoFormulario(proyectoCodigo = '', ahora = new Date()): FormularioCampo {
  return {
    proyectoCodigo,
    fecha: fechaLima(ahora),
    hora: new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(ahora),
    area: '',
    tipo: 'En investigación',
    actividad: '',
    equipo: '',
    riesgoCritico: '',
    potencial: 'confirmar',
    descripcion: '',
    personaAfectada: '',
    personas: [{ rol: '', zonaCorporal: null }],
    accionesInmediatas: '',
    revisionPrivacidad: false,
  };
}
export function textosFormulario(f: FormularioCampo, fotos: readonly File[] = []): string[] {
  return [
    f.area,
    f.actividad,
    f.equipo,
    f.riesgoCritico,
    f.descripcion,
    f.accionesInmediatas,
    ...(f.personaAfectada === 'si' ? f.personas.map((p) => p.rol) : []),
    ...fotos.map((p) => p.name),
  ];
}
export function erroresPaso(f: FormularioCampo, paso: number): string[] {
  const e: string[] = [];
  if (paso === 0) {
    if (!f.proyectoCodigo) e.push('Seleccione un proyecto.');
    if (!f.fecha || !f.hora) e.push('Indique fecha y hora.');
    if (!f.area.trim()) e.push('Indique el lugar o labor.');
  }
  if (paso === 1 && !f.descripcion.trim()) e.push('Describa qué ocurrió.');
  if (paso === 2) {
    if (!f.personaAfectada) e.push('Indique si hubo una persona afectada.');
    if (f.personaAfectada === 'si' && (!f.personas.length || f.personas.some((p) => !p.rol.trim())))
      e.push('Indique solamente el rol de cada persona afectada.');
  }
  if (paso === 3) {
    if (!f.accionesInmediatas.trim())
      e.push('Describa las acciones inmediatas o explique qué no consta.');
    if (!f.revisionPrivacidad) e.push('Revise la privacidad del texto y de las fotos.');
  }
  const privacy = revisarPrivacidad(textosFormulario(f));
  return [...e, ...privacy.bloqueos, ...privacy.advertencias];
}
export function aReporte(
  f: FormularioCampo,
  fotos: File[],
  id: string,
  data: DataJson,
  actor: ActorDemo,
  ahora = new Date(),
): ReporteCampo {
  const errores = [0, 1, 2, 3].flatMap((p) => erroresPaso(f, p));
  if (errores.length) throw new Error([...new Set(errores)].join(' '));
  const tipoGrupo = data.eventos.find((e) => e.tipo === f.tipo)?.tipo_grupo;
  if (!tipoGrupo) throw new Error('Tipo no incluido en el catálogo observado.');
  const r: ReporteCampo = {
    idempotencia: id,
    proyectoCodigo: f.proyectoCodigo,
    fecha: f.fecha,
    hora: f.hora,
    area: f.area.trim(),
    tipo: f.tipo,
    tipoGrupo,
    actividad: f.actividad.trim() || null,
    equipo: f.equipo.trim() || null,
    riesgoCritico: f.riesgoCritico.trim() || null,
    altoPotencial: f.potencial === 'confirmar' ? null : f.potencial === 'si',
    descripcion: f.descripcion.trim(),
    personas:
      f.personaAfectada === 'si'
        ? f.personas.map((p) => ({ rol: p.rol.trim(), zonaCorporal: p.zonaCorporal }))
        : [],
    accionesInmediatas: f.accionesInmediatas.trim(),
    revisionPrivacidad: true,
    fotos,
  };
  validarReporte(r, data, actor, ahora);
  return r;
}
