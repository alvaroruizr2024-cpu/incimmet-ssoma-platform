import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = { title: 'Análisis avanzado' };
import { Analisis } from '@/components/screens/analisis';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Preparando análisis…</p>}>
      <Analisis />
    </Suspense>
  );
}
