import type { EstadoSimulacion } from '../domain/reproduccion';
import type {
  ActorDemo,
  BaseNormalizada,
  CambioDatos,
  ContextoDatos,
  EventoLectura,
  AccionLectura,
  Filtros,
  LeccionLectura,
  Indicadores,
  ReporteCampo,
  ReporteLocal,
  EvidenciaLocal,
  SolicitudValidacion,
  HitoLocal,
} from '../types';
/** Contrato común. La demo no ofrece autenticación ni acuses de servidor. */
export interface DataSource {
  getBase(contexto?: ContextoDatos): Promise<BaseNormalizada>;
  getEventos(f?: Filtros): Promise<EventoLectura[]>;
  getAcciones(f?: Filtros): Promise<AccionLectura[]>;
  getLecciones(q?: string, f?: Filtros): Promise<LeccionLectura[]>;
  getIndicadores(): Promise<Indicadores>;
  crearReporte(
    reporte: ReporteCampo,
    actor: ActorDemo,
  ): Promise<{ id: string; estado: 'pendiente' | 'registrado_demo_local' }>;
  asignarAccion(
    accionId: string,
    responsableRol: string,
    fechaCompromiso: string | null,
    motivo: string,
    actor: ActorDemo,
  ): Promise<void>;
  adjuntarEvidencia(accionId: string, file: File, actor: ActorDemo): Promise<{ id: string }>;
  validarEvidencia(id: string, solicitud: SolicitudValidacion, actor: ActorDemo): Promise<void>;
  getEvidencias(accionId: string): Promise<EvidenciaLocal[]>;
  getReportesLocales(): Promise<ReporteLocal[]>;
  getHistorial(entidadId?: string): Promise<HitoLocal[]>;
  procesarColaLocal(actor: ActorDemo): Promise<{ registrados: number; envioServidor: false }>;
  restablecerCambiosLocales(confirmado: boolean): Promise<void>;
  subscribe(cb: (cambio: CambioDatos) => void): () => void;
  getAvisoPersistencia(): string | null;
  iniciarSimulacion(intervaloMs?: number): Promise<void>;
  pausarSimulacion(): void;
  reanudarSimulacion(): void;
  avanzarSimulacion(): void;
  detenerSimulacion(): void;
  getEstadoSimulacion(): EstadoSimulacion;
}
