import type { EventoLectura } from '../types';
import { unicosPorId } from './filtros';
export function secuenciaDocumental(eventos: readonly EventoLectura[], anio = 2026) {
  return unicosPorId(eventos)
    .filter((e) => e.origen === 'documental' && e.anio === anio)
    .sort(
      (a, b) =>
        (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999') ||
        (a.hora ?? '').localeCompare(b.hora ?? '') ||
        a.id.localeCompare(b.id),
    );
}
export interface EstadoSimulacion {
  estado: 'detenida' | 'reproduciendo' | 'pausada' | 'finalizada';
  anio: number;
  total: number;
  visibles: string[];
  ultimoId: string | null;
}
/** Replay is a read projection. Never appends or persists fictitious events. */
export class ReproductorDocumental {
  private secuencia: EventoLectura[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalo = 1400;
  private estado: EstadoSimulacion = {
    estado: 'detenida',
    anio: 2026,
    total: 0,
    visibles: [],
    ultimoId: null,
  };
  constructor(private readonly notificar: (evento?: EventoLectura) => void) {}
  snapshot(): EstadoSimulacion {
    return { ...this.estado, visibles: [...this.estado.visibles] };
  }
  iniciar(eventos: readonly EventoLectura[], anio = 2026, intervaloMs = 1400) {
    this.cancelarTimer();
    this.secuencia = secuenciaDocumental(eventos, anio);
    this.intervalo = Math.max(100, Math.min(10000, intervaloMs));
    this.estado = {
      estado: this.secuencia.length ? 'reproduciendo' : 'finalizada',
      anio,
      total: this.secuencia.length,
      visibles: [],
      ultimoId: null,
    };
    this.notificar();
    if (this.secuencia.length) this.activarTimer();
  }
  private activarTimer() {
    this.cancelarTimer();
    this.timer = setInterval(() => this.avanzar(), this.intervalo);
  }
  private cancelarTimer() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
  avanzar() {
    if (this.estado.estado === 'detenida' || this.estado.estado === 'finalizada') return;
    const evento = this.secuencia[this.estado.visibles.length];
    if (!evento) return;
    this.estado.visibles.push(evento.id);
    this.estado.ultimoId = evento.id;
    if (this.estado.visibles.length === this.secuencia.length) {
      this.estado.estado = 'finalizada';
      this.cancelarTimer();
    }
    this.notificar(evento);
  }
  pausar() {
    this.cancelarTimer();
    if (this.estado.estado === 'reproduciendo') {
      this.estado.estado = 'pausada';
      this.notificar();
    }
  }
  reanudar() {
    if (this.estado.estado === 'pausada') {
      this.estado.estado = 'reproduciendo';
      this.activarTimer();
      this.notificar();
    }
  }
  detener() {
    this.cancelarTimer();
    this.estado = { ...this.estado, estado: 'detenida', visibles: [], ultimoId: null };
    this.notificar();
  }
}
