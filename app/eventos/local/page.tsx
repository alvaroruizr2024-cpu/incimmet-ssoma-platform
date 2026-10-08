import { Suspense } from 'react';
import { ReporteLocalDetalle } from '@/components/screens/reporte-local-detalle';
export const metadata = { title: 'Reporte local · Evento' };
export default function ReporteLocal() {
  return (
    <Suspense fallback={<p role="status">Cargando reporte local…</p>}>
      <ReporteLocalDetalle />
    </Suspense>
  );
}
