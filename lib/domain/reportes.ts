import { exigirPrivacidad } from './privacidad';
import type { ActorDemo, DataJson, ReporteCampo, ZonaCorporal } from '../types';
import { DEMO } from '../config/demo';
import { esFechaISO, fechaLima } from './fechas';
export function exigirPermisoEscritura(actor: ActorDemo): void {
  if (!['Supervisor de campo', 'SSOMA corporativo'].includes(actor.rol))
    throw new Error('El rol de Gerencia es de lectura');
}
export function validarArchivo(archivo: File, soloFotos = false): void {
  if (!archivo || typeof archivo.name !== 'string' || typeof archivo.arrayBuffer !== 'function')
    throw new Error('Archivo inválido');
  if (!archivo.size || archivo.size > DEMO.maxArchivoBytes)
    throw new Error('El archivo debe tener contenido y no superar 10 MiB');
  if (
    !(DEMO.mimePermitidos as readonly string[]).includes(archivo.type) ||
    (soloFotos && !archivo.type.startsWith('image/'))
  )
    throw new Error('Formato de archivo no permitido');
}
export function validarReporte(
  reporte: ReporteCampo,
  datos: DataJson,
  actor: ActorDemo,
  ahora: Date,
): void {
  exigirPermisoEscritura(actor);
  const permitidas = [
    'idempotencia',
    'proyectoCodigo',
    'fecha',
    'hora',
    'area',
    'tipo',
    'tipoGrupo',
    'actividad',
    'equipo',
    'riesgoCritico',
    'altoPotencial',
    'descripcion',
    'personas',
    'accionesInmediatas',
    'revisionPrivacidad',
    'fotos',
  ];
  if (Object.keys(reporte).some((k) => !permitidas.includes(k)))
    throw new Error(
      'El reporte contiene campos no permitidos; no incluya identidad o datos médicos',
    );
  for (const clave of [
    'idempotencia',
    'proyectoCodigo',
    'fecha',
    'hora',
    'area',
    'tipo',
    'tipoGrupo',
    'descripcion',
    'accionesInmediatas',
  ] as const) {
    if (typeof reporte[clave] !== 'string' || !reporte[clave].trim())
      throw new Error(`Campo requerido: ${clave}`);
  }
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(reporte.idempotencia))
    throw new Error('Clave de idempotencia inválida');
  if (!datos.proyectos.some((p) => p.codigo === reporte.proyectoCodigo))
    throw new Error('Proyecto no registrado');
  if (actor.rol === 'Supervisor de campo' && actor.proyectoCodigo !== reporte.proyectoCodigo)
    throw new Error('Seleccione el contexto del proyecto del reporte');
  if (
    !esFechaISO(reporte.fecha) ||
    reporte.fecha > fechaLima(ahora) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(reporte.hora)
  )
    throw new Error('Revise la fecha, hora y reloj del dispositivo');
  if (
    !datos.catalogos.tipos_evento.includes(reporte.tipo) ||
    !datos.eventos.some((e) => e.tipo === reporte.tipo && e.tipo_grupo === reporte.tipoGrupo)
  )
    throw new Error('Tipo y grupo no compatibles con el catálogo observado');
  if (![true, false, null].includes(reporte.altoPotencial))
    throw new Error('Potencial: Sí, No o Por confirmar');
  for (const k of ['actividad', 'equipo', 'riesgoCritico'] as const)
    if (reporte[k] !== null && typeof reporte[k] !== 'string')
      throw new Error(`Campo inválido: ${k}`);
  const zonas: readonly (ZonaCorporal | null)[] = [
    'mano',
    'pie',
    'pierna',
    'rostro/cabeza',
    'ojo',
    'espalda',
    'hombro/brazo',
    'tórax',
    'Otra zona',
    null,
  ];
  if (!Array.isArray(reporte.personas) || reporte.personas.length > 20)
    throw new Error('Personas afectadas inválidas');
  for (const p of reporte.personas) {
    if (
      Object.keys(p).some((k) => !['rol', 'zonaCorporal'].includes(k)) ||
      typeof p.rol !== 'string' ||
      !p.rol.trim() ||
      !zonas.includes(p.zonaCorporal)
    )
      throw new Error('Solo se acepta rol y zona corporal general');
  }
  if (reporte.revisionPrivacidad !== true)
    throw new Error('Revise la privacidad del texto y los adjuntos');
  if (!Array.isArray(reporte.fotos) || reporte.fotos.length > DEMO.maxArchivos)
    throw new Error('Máximo 10 fotos por reporte');
  reporte.fotos.forEach((foto) => validarArchivo(foto, true));
  exigirPrivacidad([
    reporte.area,
    reporte.descripcion,
    reporte.actividad ?? '',
    reporte.equipo ?? '',
    reporte.riesgoCritico ?? '',
    reporte.accionesInmediatas,
    ...reporte.personas.map((p) => p.rol),
    ...reporte.fotos.map((f) => f.name),
  ]);
}
