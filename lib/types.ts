/** Contrato JSON exacto (brief §6). No convertir null a cero ni corregir la fuente. */
export type ID = string;
export type EstadoVerificado =
  | 'Cerrada con evidencia'
  | 'Declarada cerrada sin evidencia'
  | 'Abierta'
  | 'Vencida'
  | 'Sin información';
export type GrupoEvento =
  'Accidente' | 'Incidente' | 'Daño a la propiedad' | 'Desvío' | 'Ambiental' | 'En investigación';
export type TipoEvento = string;
export type NivelIncimmet = '0' | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type JerarquiaControl =
  'Eliminación' | 'Sustitución' | 'Ingeniería' | 'Administrativo' | 'EPP';
export type EstadoEvento =
  | 'Reportado'
  | 'En investigación'
  | 'Investigado'
  | 'Acciones definidas'
  | 'En seguimiento'
  | 'Cerrado';
export type ZonaCorporal =
  | 'mano'
  | 'pie'
  | 'pierna'
  | 'rostro/cabeza'
  | 'ojo'
  | 'espalda'
  | 'hombro/brazo'
  | 'tórax'
  | 'Otra zona';
export type EmpresaTipoJson =
  'INCIMMET' | 'Subcontrata' | 'Tercero' | 'Mixto (INCIMMET + tercero)' | 'No consta';
export interface MetaJson {
  generado: string;
  zona_horaria: string;
  version: string;
  fecha_corte_estados: string;
  conteos: {
    eventos: number;
    acciones: number;
    lecciones: number;
    proyectos: number;
    documentos_fuente: number;
  };
  rango_fechas: [string, string];
  privacidad: string;
  advertencias: string[];
}
export interface CatalogosJson {
  tipos_evento: string[];
  grupos_tipo: string[];
  estados_verificados: string[];
  jerarquia_control: string[];
  escala_severidad_incimmet: Record<string, string>;
}
export interface ProyectoJson {
  codigo: string;
  nombre: string;
  cliente: string;
  n_eventos: number;
  anios_con_eventos: number[];
  meta_trifr_2026: number | null;
}
export interface EventoJson {
  id: string;
  fecha: string | null;
  fecha_texto: string | null;
  anio: number;
  mes: number | null;
  hora: string | null;
  proyecto: string;
  cliente: string;
  area: string | null;
  actividad: string | null;
  puesto_rol: string | null;
  equipo: string | null;
  tipo: string;
  tipo_grupo: GrupoEvento;
  clasificacion_fuente: string | null;
  nivel_incimmet: string | null;
  pg_incimmet: string | null;
  nivel_cliente: string | null;
  pg_cliente: string | null;
  severidad_texto: string | null;
  alto_potencial: boolean;
  riesgo_critico: string | null;
  zona_cuerpo: string | null;
  descripcion: string;
  causas_inmediatas: string | null;
  causas_basicas: string | null;
  dias_perdidos: number | null;
  costo: number | null;
  costo_texto: string | null;
  penalidad: string | null;
  empresa_tipo: EmpresaTipoJson;
  empresa_detalle: string;
  estado: string | null;
  n_acciones: number;
  lecciones: string[];
  fuentes: string[];
  confianza: string;
  observaciones: string | null;
}
export interface AccionJson {
  id: string;
  evento_id: string;
  proyecto: string;
  descripcion: string;
  tipo: string;
  jerarquia_control: JerarquiaControl;
  alcance: string;
  responsable_rol: string | null;
  fecha_compromiso: string | null;
  estado_declarado: string | null;
  fecha_estado_declarado: string | null;
  estado_verificado: EstadoVerificado;
  evidencias: string[];
  observaciones: string | null;
  fuente: string;
}
export interface ControlesJson {
  eliminacion: string | null;
  sustitucion: string | null;
  ingenieria: string | null;
  administrativos: string | null;
  epp: string | null;
}
export interface LeccionJson {
  id: string;
  eventos: string[];
  proyectos: string[];
  que_paso: string;
  por_que: string;
  leccion: string;
  controles: ControlesJson;
  actividad_critica: string;
  riesgo_critico: string;
  aplicabilidad: string;
  fuentes: string[];
}
export interface IndicadorAnualJson {
  anio: number;
  ambito: string;
  ambito_nombre: string;
  fuente: string;
  hht?: number;
  dias_perdidos?: number;
  acc_nv1?: number;
  acc_nv2?: number;
  acc_nv3?: number;
  acc_nv4?: number;
  acc_nv5_6?: number;
  danos_propiedad?: number;
  eventos_investigados?: number;
  costo_propiedad_usd?: number;
  trifr?: number;
  if?: number;
  is?: number;
  ia?: number;
}
export interface Registro {
  periodo: string;
  ambito: string;
  indicador: string;
  valor: number | string;
  nota: string | null;
  fuente: string;
}
export interface ResumenSemanalJson {
  anio: number;
  proyecto: string;
  tabla: string;
  semanas: number;
  desde: string;
  hasta: string;
  hht: number;
  dias_perdidos: number | null;
  acc_nv2_6: number | null;
  acc_nv1_3: number | null;
  fuente: string;
  nota: string;
}
export interface Indicadores {
  definiciones: Record<'IF' | 'IS' | 'IA' | 'TRIFR', string>;
  anual_por_ambito: IndicadorAnualJson[];
  metas_2026: Registro[];
  doce_meses_feb_2026: Registro[];
  registros_oficiales: Registro[];
  hh_semanal_pbix_resumen: ResumenSemanalJson[];
}
export interface DocumentoFuente {
  codigo: string;
  descripcion: string;
  tipo: string;
}
export interface DataJson {
  meta: MetaJson;
  catalogos: CatalogosJson;
  proyectos: ProyectoJson[];
  eventos: EventoJson[];
  acciones: AccionJson[];
  lecciones: LeccionJson[];
  indicadores: Indicadores;
  documentos_fuente: DocumentoFuente[];
}

/** Modelo objetivo (brief §5). No se fuerza un registro histórico incompleto a este modelo. */
export interface Cliente {
  id: ID;
  nombre: string;
}
export interface Proyecto {
  codigo: string;
  nombre: string;
  clienteId: ID;
  activo: boolean;
  metaTrifr?: number;
}
export interface Contrato {
  id: ID;
  proyectoCodigo: string;
  inicio: string;
  fin?: string;
}
export interface Empresa {
  id: ID;
  nombre: string;
  tipo: 'INCIMMET' | 'Subcontrata' | 'Tercero' | 'Cliente';
}
export interface Evento {
  id: ID;
  fecha: string | null;
  hora?: string | null;
  proyectoCodigo: string;
  area?: string;
  actividad?: string;
  equipo?: string;
  tipo: TipoEvento;
  tipoGrupo: GrupoEvento;
  nivelIncimmet?: NivelIncimmet;
  pgIncimmet?: string;
  nivelCliente?: string;
  pgCliente?: string;
  altoPotencial: boolean;
  riesgoCritico?: string;
  descripcion: string;
  estado: EstadoEvento;
  diasPerdidos?: number;
  costo?: number;
  penalidad?: string;
  empresaId?: ID;
  confianza?: string;
  creadoPor: ID;
  creadoEn: string;
}
export interface PersonaAfectadaAnon {
  id: ID;
  eventoId: ID;
  rol: string;
  experienciaMeses?: number;
  zonaCorporal?: ZonaCorporal;
  empresaId?: ID;
}
export interface IdentidadRestringida {
  personaAnonId: ID;
} // Identidad real fuera del modelo analítico.
export interface Causa {
  id: ID;
  eventoId: ID;
  tipo: 'Inmediata-Acto' | 'Inmediata-Condición' | 'Básica-Personal' | 'Básica-Trabajo';
  codigo?: string;
  descripcion: string;
}
export interface Accion {
  id: ID;
  eventoId: ID;
  descripcion: string;
  tipo: string;
  jerarquia: JerarquiaControl;
  alcance?: string;
  responsableRol: string;
  fechaCompromiso?: string;
  estadoDeclarado?: string;
  fechaEstadoDeclarado?: string;
  estadoVerificado: EstadoVerificado;
}
export interface Evidencia {
  id: ID;
  accionId: ID;
  archivoUrl: string;
  tipo: 'Foto' | 'Informe' | 'Registro' | 'Otro';
  fecha: string;
  validadoPorRol?: string;
  validadoEn?: string;
}
export interface Leccion {
  id: ID;
  eventoIds: ID[];
  quePaso: string;
  porQue: string;
  leccion: string;
  controles: {
    eliminacion?: string;
    sustitucion?: string;
    ingenieria?: string;
    administrativos?: string;
    epp?: string;
  };
  actividadCritica: string;
  riesgoCritico: string;
  aplicabilidad: string;
}
export interface IndicadorPeriodo {
  anio: number;
  mes?: number;
  ambito: string;
  hht?: number;
  diasPerdidos?: number;
  accNv1?: number;
  accNv2?: number;
  accNv3?: number;
  accNv4?: number;
  accNv5_6?: number;
  danosPropiedad?: number;
  if?: number;
  is?: number;
  ia?: number;
  trifr?: number;
  fuente: string;
}

/** Modelos de lectura: conservan nulos, texto de origen y ausencia de fechas/usuarios. */
export type EventoLectura = Omit<Evento, 'estado' | 'altoPotencial' | 'creadoPor' | 'creadoEn'> & {
  anio: number;
  mes: number | null;
  cliente: string;
  puestoRol: string | null;
  empresaTipo: EmpresaTipoJson;
  estado: EstadoEvento | null;
  estadoOrigen: string | null;
  altoPotencial: boolean | null;
  creadoPor: string | null;
  creadoEn: string | null;
  causasInmediatas: string | null;
  causasBasicas: string | null;
  fuentes: string[];
  leccionIds: string[];
  origen: 'documental' | 'local';
  original: EventoJson | null;
};
export type AccionLectura = Omit<Accion, 'responsableRol'> & {
  proyectoCodigo: string;
  responsableRol: string | null;
  estadoImportado: EstadoVerificado;
  estadoOperativo: EstadoVerificado | null;
  referenciasEvidencia: string[];
  coberturaParcial: boolean;
  fuente: string;
  observaciones: string | null;
  original: AccionJson;
};
export type LeccionLectura = Leccion & {
  proyectoCodigos: string[];
  fuentes: string[];
  publicacion: 'Catalogada';
  original: LeccionJson;
};
export interface BaseNormalizada {
  meta: MetaJson;
  catalogos: CatalogosJson;
  proyectos: ProyectoJson[];
  eventos: EventoLectura[];
  acciones: AccionLectura[];
  lecciones: LeccionLectura[];
  indicadores: Indicadores;
  documentosFuente: DocumentoFuente[];
}
export type RolDemo = 'Gerencia' | 'SSOMA corporativo' | 'Supervisor de campo';
export interface ActorDemo {
  rol: RolDemo;
  proyectoCodigo?: string;
  responsableRol?: string;
}
export type ContextoDatos = 'base' | 'base+local' | 'reproduccion';
export interface Filtros {
  anios?: readonly number[];
  meses?: readonly (number | null)[];
  proyectos?: readonly string[];
  clientes?: readonly string[];
  tipos?: readonly string[];
  grupos?: readonly GrupoEvento[];
  riesgos?: readonly (string | null)[];
  actividades?: readonly (string | null)[];
  equipos?: readonly (string | null)[];
  niveles?: readonly (string | null)[];
  potenciales?: readonly (string | null)[];
  altoPotencial?: boolean | null;
  empresas?: readonly EmpresaTipoJson[];
  eventoIds?: readonly string[];
  estadosAccion?: readonly EstadoVerificado[];
  jerarquias?: readonly JerarquiaControl[];
  responsables?: readonly (string | null)[];
  desde?: string;
  hasta?: string;
  compromisoDesde?: string;
  compromisoHasta?: string;
  busqueda?: string;
  contexto?: ContextoDatos;
}
export interface PersonaReporte {
  rol: string;
  zonaCorporal: ZonaCorporal | null;
}
export interface ReporteCampo {
  idempotencia: string;
  proyectoCodigo: string;
  fecha: string;
  hora: string;
  area: string;
  tipo: string;
  tipoGrupo: GrupoEvento;
  actividad: string | null;
  equipo: string | null;
  riesgoCritico: string | null;
  altoPotencial: boolean | null;
  descripcion: string;
  personas: PersonaReporte[];
  accionesInmediatas: string;
  revisionPrivacidad: true;
  fotos: File[];
}
export type EstadoCola = 'pendiente' | 'registrado_demo_local';
export interface ArchivoLocal {
  nombre: string;
  mime: string;
  bytes: number;
  blob: Blob;
  huella: string;
}
export interface ReporteLocal {
  id: string;
  payload: Omit<ReporteCampo, 'fotos'>;
  fotos: ArchivoLocal[];
  huella: string;
  creadoEn: string;
  rol: RolDemo;
  estadoCola: EstadoCola;
  registradoEn: string | null;
  cliente: string;
}
export interface ValidacionLocal {
  aceptada: boolean;
  rol: 'SSOMA corporativo';
  fecha: string;
  motivo: string;
  alcanceCompleto: boolean;
  proyectosCubiertos: string[];
}
export interface EvidenciaLocal {
  id: string;
  accionId: string;
  archivo: ArchivoLocal;
  creadoEn: string;
  subidoPorRol: RolDemo;
  validacion: ValidacionLocal | null;
}
export interface SolicitudValidacion {
  aceptada: boolean;
  motivo: string;
  alcanceCompleto: boolean;
  proyectosCubiertos: string[];
}
export interface HitoLocal {
  id: string;
  entidadId: string;
  tipo: 'reporte' | 'evidencia' | 'validacion' | 'cola' | 'asignacion';
  rol: RolDemo;
  fecha: string;
  descripcion: string;
}
export interface CambioDatos {
  tipo:
    'reporte' | 'evidencia' | 'validacion' | 'cola' | 'restablecer' | 'simulacion' | 'asignacion';
  entidadId: string;
  evento?: EventoLectura;
}

export interface AsignacionLocal {
  accionId: string;
  responsableRol: string;
  fechaCompromiso: string | null;
  motivo: string;
  creadoEn: string;
  rol: 'SSOMA corporativo';
}
