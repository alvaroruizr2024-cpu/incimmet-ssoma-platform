'use client';
import { useSearchParams } from 'next/navigation';
import { EventoDetalle } from './evento-detalle';
export function ReporteLocalDetalle() {
  const id = useSearchParams().get('id');
  return id ? (
    <EventoDetalle id={id} local />
  ) : (
    <p>Seleccione un reporte desde la cola de campo.</p>
  );
}
