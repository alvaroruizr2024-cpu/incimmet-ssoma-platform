import type { DataSource } from './DataSource';
/** Stub deliberado: nunca devuelve listas vacías o éxitos ficticios. */
export class SupabaseDataSource implements DataSource {
  private pendiente(): never {
    throw new Error('SupabaseDataSource no está conectado. Use NEXT_PUBLIC_DATA_SOURCE=static.');
  }
  // TODO: Auth + consultas paginadas, RLS por usuario/proyecto, índices y Storage privado.
  getBase: DataSource['getBase'] = async () => this.pendiente();
  getEventos: DataSource['getEventos'] = async () => this.pendiente();
  getAcciones: DataSource['getAcciones'] = async () => this.pendiente();
  getLecciones: DataSource['getLecciones'] = async () => this.pendiente();
  getIndicadores: DataSource['getIndicadores'] = async () => this.pendiente();
  // TODO: idempotencia servidor, validación autorizada, transacciones y acuse persistente.
  crearReporte: DataSource['crearReporte'] = async () => this.pendiente();
  asignarAccion: DataSource['asignarAccion'] = async () => this.pendiente();
  adjuntarEvidencia: DataSource['adjuntarEvidencia'] = async () => this.pendiente();
  validarEvidencia: DataSource['validarEvidencia'] = async () => this.pendiente();
  getEvidencias: DataSource['getEvidencias'] = async () => this.pendiente();
  getReportesLocales: DataSource['getReportesLocales'] = async () => this.pendiente();
  getHistorial: DataSource['getHistorial'] = async () => this.pendiente();
  procesarColaLocal: DataSource['procesarColaLocal'] = async () => this.pendiente();
  restablecerCambiosLocales: DataSource['restablecerCambiosLocales'] = async () => this.pendiente();
  // TODO: Realtime con autorización; no simular una suscripción conectada.
  subscribe: DataSource['subscribe'] = () => this.pendiente();
  iniciarSimulacion: DataSource['iniciarSimulacion'] = async () => this.pendiente();
  pausarSimulacion: DataSource['pausarSimulacion'] = () => this.pendiente();
  reanudarSimulacion: DataSource['reanudarSimulacion'] = () => this.pendiente();
  avanzarSimulacion: DataSource['avanzarSimulacion'] = () => this.pendiente();
  detenerSimulacion: DataSource['detenerSimulacion'] = () => this.pendiente();
  getEstadoSimulacion: DataSource['getEstadoSimulacion'] = () => this.pendiente();
  getAvisoPersistencia(): string {
    return 'Backend Supabase pendiente de conexión';
  }
}
